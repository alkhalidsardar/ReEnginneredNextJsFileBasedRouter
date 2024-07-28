export const handler = (req , res) => {
if (req.method === 'GET') {
  console.log('it was a get request');
} 
if (req.method === 'POST') {
  console.log('it was a post request')
}
return "USER KHALID FILE"

  }