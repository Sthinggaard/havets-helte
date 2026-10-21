"""Generate private Vite development data; never writes to Firebase or browser storage."""

import collections
import datetime
import hashlib
import json
from pathlib import Path
import posixpath
import sys
import xml.etree.ElementTree as ET
import zipfile

source = Path(sys.argv[1])
target = Path(__file__).resolve().parent.parent / 'src/features/roster/roster.local.json'
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
groups = {
    'Junior mandag': ('junior', 'Mandag', 'Mandagshold'),
    'Junior tirsdag': ('junior', 'Tirsdag', 'Tirsdagshold'),
    'Ulve mandag': ('ulv', 'Mandag', 'Mandagshold'),
    'Ulve tirsdag': ('ulv', 'Tirsdag', 'Tirsdagshold'),
    # Retain the app's existing Wednesday meeting day for Troppen.
    'Troppen': ('trop', 'Onsdag', 'Onsdagshold'),
}

with zipfile.ZipFile(source) as archive:
    workbook = ET.fromstring(archive.read('xl/workbook.xml'))
    sheet = next(s for s in workbook.findall('m:sheets/m:sheet', ns) if s.get('name') == 'Spejdere')
    relationship = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    relationships = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
    sheet_path = next(r.get('Target') for r in relationships if r.get('Id') == relationship)
    sheet_path = sheet_path.lstrip('/') if sheet_path.startswith('/') else posixpath.normpath('xl/' + sheet_path)
    strings = []
    if 'xl/sharedStrings.xml' in archive.namelist():
        strings = [''.join(t.text or '' for t in item.findall('.//m:t', ns))
                   for item in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('m:si', ns)]
    properties = workbook.find('m:workbookPr', ns)
    epoch = datetime.date(1904, 1, 1) if properties is not None and properties.get('date1904') in ('1', 'true') else datetime.date(1899, 12, 30)
    members = []
    names = set()
    for row in ET.fromstring(archive.read(sheet_path)).findall('m:sheetData/m:row', ns):
        cells = {}
        for cell in row:
            column = cell.get('r').rstrip('0123456789')
            value = cell.find('m:v', ns)
            text = value.text if value is not None else ''
            cells[column] = strings[int(text)] if cell.get('t') == 's' else ''.join(t.text or '' for t in cell.findall('.//m:t', ns)) if cell.get('t') == 'inlineStr' else text
        name = ' '.join(cells.get('B', '').split())
        if not name or name == 'Navn':
            continue
        if name.casefold() in names:
            raise ValueError(f'Duplicate name at row {row.get("r")}')
        names.add(name.casefold())
        branch, weekday, team = groups[cells['A'].strip()]
        birthday = epoch + datetime.timedelta(days=float(cells['C']))
        members.append({
            'id': 'local-' + hashlib.sha256(name.casefold().encode()).hexdigest()[:16],
            'name': name,
            'initials': ''.join(part[0] for part in name.split())[:2].upper(),
            'branchId': branch, 'weekday': weekday, 'team': team,
            'active': True, 'birthYear': birthday.year,
        })

if not members:
    raise ValueError('No scouts found; existing fixture was left unchanged')
fixture = {'members': members, 'branchMeetingDays': {'junior': ['Mandag', 'Tirsdag'], 'ulv': ['Mandag', 'Tirsdag']}}
target.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
print(f'Prepared {len(members)} local scouts: {dict(collections.Counter(m["branchId"] for m in members))}')
