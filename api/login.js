const A=require('../lib/auth');const U=require('../lib/users');
module.exports=async(req,res)=>{res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'POST only'});
if(!Object.keys(U.envUsers()).length&&!U.configured())return res.status(500).json({error:'Server is not set up: APP_USER and APP_PASS (or APP_USERS) are missing in Vercel.'});
const b=req.body||{};const name=String(b.username||'').trim();let u=null;try{u=await U.verify(name,String(b.password||'').trim())}catch(e){return res.status(500).json({error:'Sign-in storage error: '+e.message})}
if(!u){await new Promise(r=>setTimeout(r,800));return res.status(401).json({error:'Wrong username or password'})}
A.setCookie(res,'na_s',A.sign({u:u.username,exp:Date.now()+30*864e5}),30*86400);res.status(200).json({ok:true})};
