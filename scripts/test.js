require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = require('../api/index.js');
const http = require('http');

const server = app.listen(5003, async () => {
  console.log('Test server on 5003');
  await app.dbReady;
  console.log('DB ready');
  const results = [];

  function req(method, path, body, token) {
    return new Promise((resolve, reject) => {
      const opts = { hostname: '127.0.0.1', port: 5003, method, path, headers: { 'Content-Type': 'application/json' } };
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
      const r = http.request(opts, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d || '{}'), ct: res.headers['content-type'] }); }
          catch { resolve({ status: res.statusCode, raw: d.slice(0, 100), ct: res.headers['content-type'] }); }
        });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  function log(name, status, extra) {
    const pass = status >= 200 && status < 400;
    const mark = pass ? '✓' : '✗';
    results.push({ name, status, pass });
    console.log(`${mark} ${name}: ${status}${extra ? ' ' + extra : ''}`);
  }

  try {
    const email = 'test' + Date.now() + '@p2p.dev';

    // 1. Register
    const reg = await req('POST', '/api/auth/register', { email, password: 'Test1234pass', firstName: 'Rohan' });
    log('Register', reg.status);
    const token = reg.body.token;

    // 2. Login
    const login = await req('POST', '/api/auth/login', { email, password: 'Test1234pass' });
    log('Login', login.status);

    // 3. Get Me
    const me = await req('GET', '/api/auth/me', null, token);
    log('Auth/Me', me.status, me.body.firstName);

    // 4. Update Profile
    const prof = await req('PUT', '/api/profile', {
      heightCm: 175, baselineWeightKg: 80,
      familyHistory: { firstDegreeT2D: 'yes', firstDegreeT2DRelatives: 'parent', firstDegreeT1D: 'no', secondDegree: 'unknown' }
    }, token);
    log('Profile Update', prof.status);

    // 5. Consent
    const consent = await req('POST', '/api/profile/consent', {}, token);
    log('Consent', consent.status, 'onboard:' + consent.body.onboardingComplete);

    // 6. Daily Log
    const logRes = await req('POST', '/api/logs/daily', {
      steps: 6500, sleepHours: 7.5, waterGlasses: 6, sedentaryHours: 5,
      moodScore: 4, stressScore: 2,
      dietSignals: { sugaryDrinks: 1, fastFood: 0 },
      physicalActivities: [{ type: 'walking', intensity: 'moderate', minutes: 30 }]
    }, token);
    log('Daily Log', logRes.status, logRes.body.riskScore ? 'risk_computed' : 'no_risk');

    // 7. Dashboard
    const dash = await req('GET', '/api/dashboard', null, token);
    log('Dashboard', dash.status, Object.keys(dash.body).length + ' keys');

    // 8. Analytics
    const anal = await req('GET', '/api/insights/analytics', null, token);
    log('Analytics', anal.status);

    // 9. Simulate
    const sim = await req('POST', '/api/insights/simulate', { avgSteps7d: 8000 }, token);
    log('Simulate', sim.status, 'delta:' + sim.body.delta);

    // 10. Settings
    const set = await req('GET', '/api/settings', null, token);
    log('Settings', set.status);

    // 11. Badges
    const badges = await req('GET', '/api/engagement/badges', null, token);
    log('Badges', badges.status, '#' + (Array.isArray(badges.body) ? badges.body.length : '?'));

    // 12. Streaks
    const streaks = await req('GET', '/api/engagement/streaks', null, token);
    log('Streaks', streaks.status, 'cur:' + (streaks.body.currentStreak || streaks.body.error));

    // 13. Recommendations
    const recs = await req('GET', '/api/recommendations', null, token);
    log('Recommendations', recs.status, '#' + (Array.isArray(recs.body) ? recs.body.length : '?'));

    // 14. CSV Export
    const csv = await req('GET', '/api/export/csv', null, token);
    log('CSV Export', csv.status, 'type:' + (csv.ct || ''));

    // 15. Correlations
    const corr = await req('GET', '/api/insights/correlations', null, token);
    log('Correlations', corr.status);

    // Summary
    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    console.log(`\n${'='.repeat(40)}`);
    console.log(`RESULTS: ${passed}/${total} passed`);
    if (passed < total) {
      console.log('FAILED:');
      results.filter(r => !r.pass).forEach(r => console.log(`  ${r.name}: ${r.status}`));
    }
  } catch (e) {
    console.error('TEST ERROR:', e.message);
  }

  server.close();
  process.exit(0);
});
