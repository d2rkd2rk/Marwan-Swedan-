import postgres from 'postgres';

const sql=postgres(process.env.DATABASE_URL||'',{
  max:5,
  idle_timeout:20,
  connect_timeout:10,
  prepare:false,
});

export function dbReady(){return Boolean(process.env.DATABASE_URL)}
export default sql;