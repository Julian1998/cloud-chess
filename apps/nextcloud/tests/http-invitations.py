"""Local HTTP regression check. Requires the three demo accounts and their password.
Run: CLOUD_CHESS_DEMO_PASSWORD=... python3 apps/nextcloud/tests/http-invitations.py
"""
import html
import http.cookiejar
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get('CLOUD_CHESS_URL', 'http://localhost:8080').rstrip('/')
PASSWORD = os.environ['CLOUD_CHESS_DEMO_PASSWORD']

class Client:
    def __init__(self, user):
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        page = self.opener.open(BASE + '/login').read().decode()
        token = html.unescape(re.search(r'data-requesttoken="([^"]+)"', page)[1])
        data = urllib.parse.urlencode({'user': user, 'password': PASSWORD, 'requesttoken': token}).encode()
        self.opener.open(urllib.request.Request(BASE + '/login', data, {'Origin': BASE})).read()
        page = self.opener.open(BASE + '/index.php/apps/cloud_chess/').read().decode()
        match = re.search(r'data-request-token="([^"]+)"', page)
        assert match, 'Login did not reach Cloud Chess'
        self.token = html.unescape(match[1])

    def request(self, path, body=None, csrf=True):
        headers = {'Accept': 'application/json'}
        if body is not None:
            headers['Content-Type'] = 'application/json'
            if csrf:
                headers['requesttoken'] = self.token
        request = urllib.request.Request(BASE + '/index.php/apps/cloud_chess/api' + path,
            data=None if body is None else json.dumps(body).encode(), headers=headers)
        try:
            response = self.opener.open(request)
        except urllib.error.HTTPError as error:
            response = error
        payload = response.read().decode()
        try:
            payload = json.loads(payload)
        except ValueError:
            pass
        return response.status, payload

a, b, c = (Client('chess_' + name) for name in ('alice', 'bob', 'carla'))
# Close only pending invitations between these dedicated demo users, keeping history.
for invitation in b.request('/invitations')[1]['invitations']:
    if invitation['challengerId'] == 'chess_alice' and invitation['opponentId'] == 'chess_bob' and invitation['status'] == 'pending':
        assert b.request('/invitations/' + invitation['id'] + '/decline', {})[0] == 200
body = {'opponentId': 'chess_bob', 'colorPreference': 'white', 'turnDuration': 'P1D'}
assert a.request('/invitations', body, csrf=False)[0] in (403, 412), 'CSRF check missing'
assert a.request('/invitations', {**body, 'turnDuration': 'P3D'})[0] == 400
status, result = a.request('/invitations', {**body, 'actorId': 'chess_carla'})
assert status == 201, (status, result)
invitation = result['invitation']
assert invitation['challengerId'] == 'chess_alice', 'Client supplied actor was trusted'
path = '/invitations/' + invitation['id']
assert c.request(path + '/accept', {})[0] == 404
assert c.request(path + '/decline', {})[0] == 404
assert a.request(path + '/accept', {})[0] == 404
assert all(i['id'] != invitation['id'] for i in c.request('/invitations')[1]['invitations'])
assert a.request('/invitations', body)[0] == 409
assert b.request(path + '/accept', {})[0] == 200
assert b.request(path + '/accept', {})[0] == 409
assert b.request(path + '/decline', {})[0] == 409
print('PASS: real HTTP login, CSRF, input validation, actor spoofing, user isolation and replay conflicts')
