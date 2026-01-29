(async ()=>{
  try{
    const res = await fetch('http://localhost:3000/api/faturas/metrics');
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  }catch(e){
    console.error('ERR', e.message)
  }
})()
