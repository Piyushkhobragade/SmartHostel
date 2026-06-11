const http = require('http');

async function test() {
  const loginReq = http.request({hostname:'43.205.203.235',port:80,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json'}}, res => {
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      const token = JSON.parse(d).token;
      
      const req = http.request({hostname:'43.205.203.235',port:80,path:'/api/student/ask',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}}, r=>{
        let d2=''; r.on('data',c=>d2+=c); r.on('end',()=>console.log('STUDENT ASK:', d2))
      });
      req.write(JSON.stringify({message:'how much do I owe'})); req.end();
    })
  });
  loginReq.write(JSON.stringify({username:'arjun001',password:'password123'})); loginReq.end();
}
test();
