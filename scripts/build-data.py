#!/usr/bin/env python3
"""Aggregates of the SBA 7(a) and 504 FOIA files for one fiscal year (RECETTE §4: replayable script).

Usage:
    python3 -I scripts/build-data.py <FOIA_7a_FY2020_Present.csv> <FOIA_504_FY2010_Present.csv> <DPRIME.csv> [FY]

DPRIME.csv: daily bank prime loan rate (Federal Reserve H.15), as served by
https://fred.stlouisfed.org/graph/fredgraph.csv?id=DPRIME . SOP 50 10 8.1 sets a variable 7(a) rate on the prime of the
first business day of the month, so each loan's spread = its initial rate minus that month's prime.

Source: https://data.sba.gov/dataset/7a-504-foia (U.S. Government Works, quarterly). The raw files are not
kept in git (188 MB and 60 MB); download them again with curl to replay. Output: src/data/foia.json.

Privacy: only aggregates leave this script. No borrower name, street, city or ZIP is read into the output;
lenders and CDCs are institutions and are named. Cells with fewer than MIN_CELL loans are suppressed (null).
"""
import csv, json, os, statistics as st, sys
from collections import Counter, defaultdict

MIN_CELL = 10
STATES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado',
    'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan',
    'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
    'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
    'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
}
# Bands = the loan-size steps of SBA's maximum variable rate (SOP 50 10 8.1).
BANDS = [(0, 50000), (50000, 250000), (250000, 350000), (350000, 10**12)]
def band(x):
    for i, (lo, hi) in enumerate(BANDS):
        if lo < x <= hi: return i
    return len(BANDS) - 1

VAR_CAPS = [(50000, 6.5), (250000, 6.0), (350000, 4.5), (10**12, 3.0)]   # SOP 50 10 8.1
FIX_CAPS = [(25000, 8.0), (50000, 7.0), (250000, 6.0), (10**12, 5.0)]    # 87 FR 46883
def cap_spread(t, amt):
    caps = VAR_CAPS if t == 'V' else FIX_CAPS if t == 'F' else None
    return None if caps is None else next(c for hi, c in caps if amt <= hi)

def r2(x): return None if x is None else round(x, 2)
def med(xs): return r2(st.median(xs)) if len(xs) >= MIN_CELL else None
def share_at_cap(R):
    R = [r for r in R if r['spread'] is not None]
    return r2(sum(1 for r in R if r['atCap']) / len(R)) if len(R) >= MIN_CELL else None
def pcts(xs):
    if len(xs) < MIN_CELL: return None
    q = st.quantiles(xs, n=20, method='inclusive')  # 5 % steps
    return {'n': len(xs), 'p': [r2(min(xs))] + [r2(v) for v in q] + [r2(max(xs))]}
def clean(s): return ' '.join((s or '').split())
AGE = {'Existing or more than 2 years old': 'existing', 'Startup, Loan Funds will Open Business': 'startup',
       'New Business or 2 years or less': 'new', 'Change of Ownership': 'buyout'}
PROG = {'Preferred Lenders Program': 'plp', 'SBA Express Program': 'express', '7a General': 'general'}

def main():
    f7, f504, fprime = sys.argv[1], sys.argv[2], sys.argv[3]
    fy = sys.argv[4] if len(sys.argv) > 4 else '2026'
    daily = [(d, float(v)) for d, v in (l.strip().split(',') for l in open(fprime).readlines()[1:]) if v]
    def prime_month(ym):  # first published value of the month
        return next(v for d, v in daily if d[:7] == ym)
    rows = [r for r in csv.DictReader(open(f7, encoding='utf-8')) if r['ApprovalFY'] == fy]
    rows504 = [r for r in csv.DictReader(open(f504, encoding='utf-8')) if r['ApprovalFY'] == fy]
    as_of = rows[0]['AsOfDate']
    for r in rows:
        r['amt'] = float(r['GrossApproval']); r['b'] = band(r['amt'])
        r['rate'] = float(r['InitialInterestRate']) if r['InitialInterestRate'].strip() else None
        r['t'] = r['FixedorVariableInterestInd'].strip()
        r['bank'] = clean(r['BankName']); r['naics'] = clean(r['NaicsDescription'])
        r['term'] = float(r['TermInMonths'] or 0)
        r['prime'] = prime_month(r['ApprovalDate'][:7])
        r['spread'] = None if r['rate'] is None else round(r['rate'] - r['prime'], 3)
        r['cap'] = cap_spread(r['t'], r['amt'])
        r['atCap'] = r['spread'] is not None and r['cap'] is not None and r['spread'] >= r['cap'] - 0.005
    for r in rows504:
        r['amt'] = float(r['GrossApproval']); r['cdc'] = clean(r['CDC_Name']); r['naics'] = clean(r['NaicsDescription'])

    def rate_table(R):
        out = {}
        for t in ('V', 'F'):
            out[t] = [pcts([r['rate'] for r in R if r['t'] == t and r['b'] == i and r['rate'] is not None]) for i in range(len(BANDS))]
        return out

    def summary(R, R504, lenders_n=5):
        n = len(R)
        if not n: return None
        amts = [r['amt'] for r in R]
        V = [r['rate'] for r in R if r['t'] == 'V' and r['rate'] is not None]
        F = [r['rate'] for r in R if r['t'] == 'F' and r['rate'] is not None]
        bylender = defaultdict(list)
        for r in R: bylender[r['bank']].append(r)
        top = sorted(bylender.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:lenders_n]
        lenders = [{
            'name': k, 'n': len(v), 'total': round(sum(r['amt'] for r in v)),
            'medAmt': r2(st.median([r['amt'] for r in v])),
            'medV': med([r['rate'] for r in v if r['t'] == 'V' and r['rate'] is not None]),
            'medSpreadV': med([r['spread'] for r in v if r['t'] == 'V' and r['spread'] is not None]),
            'atCapV': share_at_cap([r for r in v if r['t'] == 'V']),
            'expressShare': r2(sum(1 for r in v if r['ProcessingMethod'] == 'SBA Express Program') / len(v)),
            'hq': Counter(r['BankState'] for r in v).most_common(1)[0][0],
        } for k, v in top]
        ages = Counter(AGE.get(r['BusinessAge'], 'other') for r in R)
        progs = Counter(PROG.get(r['ProcessingMethod'], 'other') for r in R)
        return {
            'n': n, 'total': round(sum(amts)), 'medAmt': r2(st.median(amts)), 'meanAmt': r2(st.mean(amts)),
            'bands': [sum(1 for r in R if r['b'] == i) for i in range(len(BANDS))],
            'smallShare': r2(sum(1 for a in amts if a <= 150000) / n),
            'fixedShare': r2(len(F) / n), 'medV': med(V), 'medF': med(F),
            'medVBand': [med([r['rate'] for r in R if r['t'] == 'V' and r['b'] == i and r['rate'] is not None]) for i in range(len(BANDS))],
            'medSpreadVBand': [med([r['spread'] for r in R if r['t'] == 'V' and r['b'] == i and r['spread'] is not None]) for i in range(len(BANDS))],
            'atCapVBand': [share_at_cap([r for r in R if r['t'] == 'V' and r['b'] == i]) for i in range(len(BANDS))],
            'atCapV': share_at_cap([r for r in R if r['t'] == 'V']),
            'atCapF': share_at_cap([r for r in R if r['t'] == 'F']),
            'medTermMonths': r2(st.median([r['term'] for r in R])),
            'longTermShare': r2(sum(1 for r in R if r['term'] >= 180) / n),
            'ages': {k: ages.get(k, 0) for k in ('existing', 'new', 'startup', 'buyout', 'other')},
            'programs': {k: progs.get(k, 0) for k in ('plp', 'express', 'general', 'other')},
            'cancelled': sum(1 for r in R if r['LoanStatus'] == 'CANCLD'),
            'franchiseShare': r2(sum(1 for r in R if r['FranchiseCode'].strip()) / n),
            'collateralShare': r2(sum(1 for r in R if r['CollateralInd'] == 'Y') / n),
            'jobs': round(sum(float(r['JobsSupported'] or 0) for r in R)),
            'lenders': lenders, 'lenderCount': len(bylender),
            'industries': [{'name': k, 'n': c} for k, c in Counter(r['naics'] for r in R if r['naics']).most_common(5)],
            'sectors': dict(Counter(r['NaicsCode'][:2] for r in R if r['NaicsCode'].strip()).most_common()),
            'revolverShare': r2(sum(1 for r in R if r['RevolverStatus'] == 'Y') / n),
            'creditUnionShare': r2(sum(1 for r in R if r['BankNCUANumber'].strip()) / n),
            'soldShare': r2(sum(1 for r in R if r['SoldSecMrktInd'] == 'Y') / n),
            'franchises': [{'name': k, 'n': c} for k, c in Counter(clean(r['FranchiseName']) for r in R if clean(r['FranchiseName'])).most_common(3) if c >= 5],
            'counties': [{'name': k.title(), 'n': c} for k, c in Counter(clean(r['ProjectCounty']) for r in R if clean(r['ProjectCounty'])).most_common(3) if c >= 5],
            'f504': None if not R504 else {
                'n': len(R504), 'total': round(sum(r['amt'] for r in R504)), 'medAmt': r2(st.median([r['amt'] for r in R504])),
                'cdcs': [{'name': k, 'n': c} for k, c in Counter(r['cdc'] for r in R504).most_common(3)],
                'term25Share': r2(sum(1 for r in R504 if float(r['TermInMonths'] or 0) == 300) / len(R504)),
            },
        }

    nat = summary(rows, rows504, lenders_n=25)
    nat['rates'] = rate_table(rows)
    nat['spreads'] = {t: [pcts([r['spread'] for r in rows if r['t'] == t and r['b'] == i and r['spread'] is not None]) for i in range(len(BANDS))] for t in ('V', 'F')}
    nat['primeByMonth'] = {ym: prime_month(ym) for ym in sorted({r['ApprovalDate'][:7] for r in rows})}
    nat['months'] = dict(sorted(Counter(r['ApprovalDate'][:7] for r in rows).items()))
    nat['states'] = len({r['ProjectState'] for r in rows})
    # Per lender, the variable-rate median of each size band (national top 25 only).
    for L in nat['lenders']:
        R = [r for r in rows if r['bank'] == L['name']]
        L['medVBand'] = [med([r['rate'] for r in R if r['t'] == 'V' and r['b'] == i and r['rate'] is not None]) for i in range(len(BANDS))]
        L['states'] = len({r['ProjectState'] for r in R})
    nat_naics = Counter(r['naics'] for r in rows if r['naics'])
    states = {}
    for code, name in STATES.items():
        R = [r for r in rows if r['ProjectState'] == code]
        R5 = [r for r in rows504 if r['ProjectState'] == code]
        s = summary(R, R5)
        s['name'] = name
        s['localLenderShare'] = r2(sum(1 for r in R if r['BankState'] == code) / len(R))
        # Variable-rate margin of lenders based in the state against lenders based elsewhere.
        s['localMedSpreadV'] = med([r['spread'] for r in R if r['BankState'] == code and r['t'] == 'V' and r['spread'] is not None])
        s['outMedSpreadV'] = med([r['spread'] for r in R if r['BankState'] != code and r['t'] == 'V' and r['spread'] is not None])
        # The trade most over-represented against the national mix (at least MIN_CELL loans in the state).
        cn = Counter(r['naics'] for r in R if r['naics'])
        best = max(((k, c, (c / len(R)) / (nat_naics[k] / len(rows))) for k, c in cn.items() if c >= MIN_CELL), key=lambda x: x[2], default=None)
        s['overIndustry'] = None if not best else {'name': best[0], 'code': Counter(r['NaicsCode'] for r in R if r['naics'] == best[0]).most_common(1)[0][0], 'n': best[1], 'ratio': r2(best[2]), 'natShare': round(nat_naics[best[0]] / len(rows), 4)}
        states[code] = s
    # Ranks among the 51 (1 = most loans, largest median, highest median variable rate).
    def rank(key, rev=True):
        order = sorted((c for c in states if states[c][key] is not None), key=lambda c: states[c][key], reverse=rev)
        for i, c in enumerate(order): states[c].setdefault('rank', {})[key] = i + 1
    for k in ('n', 'medAmt', 'medV', 'total', 'fixedShare', 'localLenderShare'): rank(k)
    out = {
        'fy': int(fy), 'asOf': as_of, 'minCell': MIN_CELL,
        'bands': [[lo, None if hi >= 10**12 else hi] for lo, hi in BANDS],
        'national': nat, 'states': states,
        'territories': {c: sum(1 for r in rows if r['ProjectState'] == c) for c in ('PR', 'VI', 'GU')},
        'source': 'https://data.sba.gov/dataset/7a-504-foia',
        'files': [os.path.basename(f7), os.path.basename(f504), os.path.basename(fprime)],
    }
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'foia.json')
    json.dump(out, open(dest, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'FY{fy}: {len(rows)} 7(a) loans, {len(rows504)} 504 loans, as of {as_of} -> {os.path.normpath(dest)}')

if __name__ == '__main__':
    main()
