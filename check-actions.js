const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/Piyushkhobragade/SmartHostel/actions/runs',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js Script',
    'Accept': 'application/vnd.github.v3+json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const runs = JSON.parse(data).workflow_runs;
    const latest = runs[0];
    console.log(`Latest Run: ${latest.name} - ${latest.conclusion} (${latest.html_url})`);
    
    // Fetch jobs for latest run
    const jobsOptions = {
      hostname: 'api.github.com',
      path: `/repos/Piyushkhobragade/SmartHostel/actions/runs/${latest.id}/jobs`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Script',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    https.request(jobsOptions, (jobRes) => {
      let jobData = '';
      jobRes.on('data', (chunk) => { jobData += chunk; });
      jobRes.on('end', () => {
        const jobs = JSON.parse(jobData).jobs;
        jobs.forEach(j => {
          console.log(`Job: ${j.name} - Status: ${j.status} - Conclusion: ${j.conclusion}`);
          if (j.conclusion === 'failure') {
            console.log(`\n--- Failed Steps for ${j.name} ---`);
            j.steps.filter(s => s.conclusion === 'failure').forEach(s => {
              console.log(`Step: ${s.name}`);
            });
          }
        });
      });
    }).end();
  });
});
req.end();
