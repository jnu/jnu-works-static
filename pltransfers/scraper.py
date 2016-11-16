#-*- coding: utf8 -*-
'''
$ python scraper.py [--csv <transfers.csv>] [--meta <meta.json>] URIs...

Download uri and parse it. Store transfers in transfers.csv, and store some
associated meta information in meta.json.

JN 2013
'''

from bs4 import BeautifulSoup as bs
from nameparser import HumanName
import codecs
import argparse
import csv
import json
import base64
import urllib
import urllib2
import urlparse
import re
from sys import stderr, argv, exit


def parse_fbd_line(td, current_team, direction):
    country = td.find('img')['alt'].encode('utf8')
    links = td.find_all('a')
    assert len(links) == 2

    name_link, team_link = links

    full_name_text = name_link.text.encode('utf8')
    last_name_text = name_link.find('b').text.encode('utf8')

    diff = len(full_name_text)-len(last_name_text)
    first_name_text = full_name_text[:diff].strip()

    team_text = team_link.text.encode('utf8')

    full_text = td.text.encode('utf8')
    re_date = re.search(r'-\s+(\d{2})\s+(\w{3,4})\s+(\d{4})$',full_text)

    last_name_text = last_name_text.split("(")[0].strip()

    day, month, year = [""]*3
    if re_date is not None:
        day, month, year = re_date.groups()

    new_entry = [
        current_team,
        direction,
        team_text,
        year,
        month,
        day,
        country,
        last_name_text,
        first_name_text,
        "", # price
        ""  # loan
    ]
    return new_entry


def parse_tm_line(line, current_team, direction, year):

    cells = line.find_all('td')

    loan = 0

    full_name_text = cells[0].text
    if u"*" in full_name_text:
        # Player is loaned
        loan = 1
        return None

    full_name_text = re.sub(r'[^\w\d\s]', u'',
        cells[0].text, flags=re.UNICODE).strip()
    try:
        full_name = HumanName(full_name_text)
    except Exception as e:
        print >>stderr, str(e)
        print >>stderr, "Name: ", full_name_text
        return None
        exit(7)

    last_name_text = full_name.last.encode('utf8')
    first_name_text = full_name.first.encode('utf8')

    team_text = cells[1].find('img')['alt'].encode('utf8')

    price = cells[3].text
    if u"free" in price.lower():
        price = "0"
    else:
        price = re.sub(r'[^\d]', u'',
            cells[3].text, flags=re.UNICODE).encode('utf8')

    month = ''
    day = ''
    country = ''

    new_entry = [
        current_team,
        direction,
        team_text,
        year,
        month,
        day,
        country,
        last_name_text,
        first_name_text,
        price,
        loan
    ]

    return new_entry


def scrape(url, header=True, local=False):
    '''
    Scrape the given URL. Download and parse it.
    Returns parsed transfers as list of lists, and dict of team logo paths on
    the remote server (for downloading in a separate routine)
    '''
    

    html = ''
    if local:
        # Get file locally
        print >>stderr, "Opening", url, "..."
        with codecs.open(url, 'r', 'utf8') as fh:
            html = fh.read()

    else:
        print >>stderr, "Downloading", url, "..."
        uh = urllib2.urlopen(url)
        html = uh.read()

    soup = bs(html)
    format = 0

    print >>stderr, "Validating source ..."
    transfer_tables = soup.find_all('table', attrs={'width': '357'})
    team_cells = soup.find_all('td', attrs={'rowspan': '4'})


    if len(transfer_tables)==0 or len(transfer_tables) != len(team_cells)*2:
        # Check another format
        format = 1
        team_cells = soup.find_all('h2',
            attrs={'class': 'tabellen_ueberschrift_ohne'})
        transfer_tables = sum([
            t.find_all('table') for t in soup.find_all('table',
            attrs={'class':'standard_tabelle'})], [])

    # Make sure page checks out
    try:
        assert len(transfer_tables) == len(team_cells)*2
    except:
        print >>stderr, "Url:", url
        print >>stderr, "Failed assertion teamcells size."
        print >>stderr, "  Transfer Tables length:", len(transfer_tables),
        print >>stderr, "- Team Cells:", len(team_cells)
        dump = raw_input("dump? ")
        if (dump+'es').lower()[:3]=='yes':
            print >>stderr, "  Dump:"
            print >>stderr, soup.find('body')
        exit(5)

    # Get team names
    if format==0:
        team_names = [td.find('a').text.encode('utf8') for td in team_cells]
        team_logo_paths = [
            urlparse.urljoin(url, td.find('img')['src']) for td in team_cells
        ]
    elif format==1:
        team_names = [h2.find('a').text.encode('utf8') for h2 in team_cells]
        team_logo_paths = [
            urlparse.urljoin(url, h2.find('img')['src']) for h2 in team_cells
        ]

    # Tidy up team names
    team_names = [re.sub(r'\s+', ' ', t).strip() for t in team_names]

    # Form CSV as list of lists
    header_entry = [
            "Team",
            "Direction",
            "Other Team",
            "Year",
            "Month",
            "Day",
            "Country",
            "Last Name",
            "First Name",
            "Price",
            "Loan"
        ]

    entries = []

    if header:
        entries.append(header_entry)

    print >>stderr, "Processing transfers (%d teams, %d tables) ..." \
        % (len(team_cells), len(transfer_tables))

    if format==1:
        year = soup.find('option',
            attrs={'selected': 'selected'})['value'].encode('utf8')

    for i, transfer_table  in enumerate(transfer_tables):
        # Iterate through transfer tables and parse data
        current_team = team_names[i//2].encode('utf8')
        direction = "in" if i%2==0 else "out"

        print >>stderr, "  ", current_team, "/", direction

        lines = []

        if format==0:
            lines = transfer_table.find_all('td')
        elif format==1:
            lines = transfer_table.find_all('tr',
                class_=lambda c: c is not None)

        for line in lines:
            if format==0:
                new_entry = parse_fbd_line(line, current_team, direction)
            elif format==1:
                new_entry = parse_tm_line(line, current_team, direction, year)            

            # Make entry
            if new_entry is not None:
                entries.append(new_entry)

    print >>stderr, "Done!"

    return entries, dict(zip(team_names, team_logo_paths))



def download_image(uri):
    '''Download an image as base64'''
    uih = urllib.urlopen(uri)
    ib64 = base64.encodestring(uih.read())
    return ib64


def get_logos(logo_paths):
    '''
    Accepts dict of logo_paths and downloads them, returns dict with same 
    keys as logo_paths and Base64-encoded images as values.
    '''
    print >>stderr, "Downloading logos ..."
    logos = dict()

    for team_name, logo_path in logo_paths.iteritems():
        print >>stderr, "  ", team_name, "..."
        logos[team_name] = download_image(logo_path)

    print >>stderr, "Done."

    return logos



if __name__=='__main__':
    # Execute
    parser = argparse.ArgumentParser(description=__doc__)

    parser.add_argument('--csv', '-c', type=str, help="Output rows here",
        default=None)
    parser.add_argument('--json', '-j', type=str, help="Output meta here",
        default=None)
    parser.add_argument('--local', '-l', default=False,
        action="store_true", help="Don't download from internet")
    parser.add_argument('urls', type=str, nargs="+", help="Urls to scrape")

    cli = parser.parse_args()

    print >>stderr, "Starting ..."

    csv_file_name = cli.csv
    json_file_name = cli.json

    uris = [uri.strip() for uri in cli.urls]

    entries = []
    logos = {}
    team_map = []

    for i, uri in enumerate(uris):
        new_entries, new_logo_paths = scrape(uri, header=i==0, local=cli.local)

        for entry in new_entries:
            # Sanitize
            for j, cell in enumerate(entry):
                if isinstance(cell, unicode):
                    print >>stderr, "  CAUGHT Unicode trying to sneak in!"
                    entry[j] = cell.encode('utf8')

            # Add to team map
            if entry[0]!='Team':
                if entry[0] not in team_map:
                    team_map.append(entry[0])
                entry[0] = team_map.index(entry[0]) 

            entries.append(entry)


        if json_file_name is not None:
            new_logos = get_logos(new_logo_paths)
            logos.update(new_logos)




    print >>stderr, "Writing output ..."

    print json.dumps(team_map)

    with open(csv_file_name, 'w') as fh:
        writer = csv.writer(fh)

        for entry in entries:
            writer.writerow(entry)

    if json_file_name is not None:
        with open(json_file_name, 'w') as fh:
            fh.write(json.dumps(logos))

    print >>stderr, "All finished!"












