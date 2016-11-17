#!/var/chroot/home/content/41/10223541/html/python/bin/python
# -*- coding: utf8 -*-
'''
$ python ncaa2013/web/poll_tourny_results.py

Poll the NCAA server for Tournament results. Call ./setwinner.py with
any results that are found to make sure they are persisted in the DB.

Copyright (c) 2013 Joe Nudell
Freely distributable under the MIT License.
'''

import urllib
import urllib2
import json
import os
import pickle
from datetime import datetime
from sys import exit


# Get current time
#curtime = datetime.time(datetime.now())

# If current time is after midnight or before 11 AM, don't run script.
#midnight = curtime.replace(hour=0, minute=0, second=0, microsecond=0)
#elevenam = curtime.replace(hour=11,minute=0, second=1, microsecond=0)
#if curtime > midnight and curtime < elevenam:
#    exit(0)



## RETURN ##
## HEADER ##
print "Content-type: text/plain;charset=utf-8"
print
## CONTENT ##



source = "http://data.ncaa.com/jsonp/gametool/brackets/championships/basketball-men/d1/2012/data.json?callback=."


dbmgrurl = "http://joenoodles.com/widgets/ncaa/setwinner.py"


# Maybe will need to mask this in the future?
# Not sure that NCAA cares about robots?
query_response = urllib2.urlopen(source).read().strip()[2:-2]


obj = json.loads(query_response)




ended_games = [game for game in obj['games'] if game['gameState']=='final']


stored_games_file = 'savedgames.pickle'
saved_games = []
if os.path.exists(stored_games_file):
    with open(stored_games_file, 'r') as fh:
        saved_games = pickle.load(fh)
    if type(saved_games) is not list:
        exit(3)




# build request tuples (winner name, loser name, winner score, loser score,)
tuples = []

def get_name_and_score(team_obj):
    names = team_obj['names']
    name = ''
    score = int(team_obj['score'])
    
    if len(names['short'])>0:
        name = names['short']
    elif len(names['seo'])>0:
        name = names['short']
    elif len(names['char6'])>0:
        name = names['char6']
    else:
        name = names['full']

    return (name, score,)




season = '2012-13'



for game in ended_games:
    hometeam = get_name_and_score(game['home'])
    awayteam = get_name_and_score(game['away'])
    winner, winner_score = hometeam if game['home']['winner']=='true' else awayteam
    loser, loser_score= awayteam if game['home']['winner']=='true' else hometeam

    game_tuple = (season, winner, loser, winner_score, loser_score,)

    # Don't try to reinsert saved games
    if game_tuple not in saved_games:
        tuples.append(game_tuple)




# Send out requests to conroller
for gameinfo in tuples:
    print "Adding %s (%d) over %s (%d) to DB ..." % (gameinfo[1], gameinfo[3],
                                                     gameinfo[2], gameinfo[4])
    
    # URL-encode parameters
    fields = ('season', 'winnername', 'losername', 'winnerscore', 'loserscore',)
    cgiparams = dict(zip(fields, gameinfo))
    coded_params = urllib.urlencode(cgiparams)
    
    print coded_params

    game_add_url = '%s?%s' % (dbmgrurl, coded_params)
    
    uh = urllib2.urlopen(game_add_url)
    resp = json.load(uh)

    if resp.has_key('error'):
        print "  ERROR: ", resp['error']
    else:
        if not resp['success']:
            print "  Unsuccessful!!!??!!??!"
        else:
            print "  Success!"
            saved_games.append(gameinfo)





# Repickle saved games
with open(stored_games_file, 'w') as fh:
    pickle.dump(saved_games, fh)
    
