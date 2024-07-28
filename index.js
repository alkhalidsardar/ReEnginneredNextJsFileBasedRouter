import express from "express";
import fs from "fs";

const app = express();

//to access json we use middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//declare a const specifying root folder
const ROOT_FOLDER = "./approutes/";


//handleRegularRoutes function to send result - this will import the function of that file which returns the file content
async function handleRegularRoutes(fileUrl , req , res){
  try {
    //import the file and store whatever its exporting inside module variable
    const module = await import(fileUrl);
//set data as files function 32:47 , then pass the module which is file and its handlers which is the file(index.js) function
//so it shall run the file in the url
let data = null;

//checking type of req
const httpVerb = req.method.toLowerCase()


//we can grab objects with [] instead of dot notation
//Check if the module has a function corresponding to the HTTP method and invoke it.
// If not, fall back to a default handler.
if (module[httpVerb]) {
  //module[httpVerb] retrieves the function with the HTTP method from the module
  data = await module[httpVerb](req , res)
  //By adding (), you invoke this function. In this case, \
  //module[httpVerb](req, res) calls the function with req and res as arguments.
} else {
  data = module.handler(req , res)
}
return data



  } catch (error) {
    console.log(error);
    res.statusCode = 404;
    return false;
  }
}

//funtion to handle dynamic routes 
async function handleDynamicRoutes(folder){
  try {
    const files = await fs.promises.readdir(folder)
    //fs.promises: This is the Promises-based API of the fs module, which provides asynchronous file system operations that return promises.
//readdir: This function reads the contents of a directory.
//folder: This is the path to the directory whose contents you want to read.

const dynamicFileName =  await files.find(filename => { 
  return filename.match(/\[[a-zA-Z0-9\._]+\]/)
  //if The pattern text[abc123] matches, so the function returns ["[abc123]"].
})

return {
  file: dynamicFileName,
  param: dynamicFileName.replace("[" , "").replace("].js" , "")
  //param are the exact file name text inside brackets
}
  } catch (error) {
    console.log(error);
    return null;
  }
}



// app.get('/' , (req , res) => {
//     return res.send('hello world')
//     })
//to track all routes from '/' to 'anything' and since our server might  acces files we need async function ,
//also we can get the url property from the req object
app.all("/*", async (req, res) => {
  console.log("this is req url => " + req.url);

  //joining root folder with req.url and wherever there is two slashes replace them with 1 so there is no clash
  let fileUrl = (ROOT_FOLDER + req.url).replace("//", "/");
  console.log("this is the fileurl => " + fileUrl);

  //to check whether the file with name fileurl exists or not and concat with .js or whatever you use
  let isFile = fs.existsSync(fileUrl + ".js");


  if (!isFile) {
    //if file dosent exist then file url should index.js as there should be js file so that fileUrl should be
    //mainapp folder  / next folder / index.js
    fileUrl += "/index.js";
  } // if file does exists then we need to just add .js to the file name typed in url
  // example - main app folder / nextfoldername / filename.js
  else {
    fileUrl += ".js";
  }
console.log(fileUrl);
//the problem is if the file named xyz dosent exist already then it will add xyz/index.js 
//se we sent route not found if result is false


//result will have what is returned from the handleRegularroutes funtion which is  data
//data is accesing the module and invoking its funtion which sends a response 
//through the parameters object res wheich thus send a promise which is stored in result
//then the result is sent as response by the server
let result = await handleRegularRoutes(fileUrl , req ,res);





if (result === false){
  //splitting the url in multiple words
  const pathArray = (ROOT_FOLDER + req.url).replace('//' , '/').split('/')
  //first construct the string url then split every word after /





  //accesing the last word,also poping off last word from original array
  const lastElement = pathArray.pop()


  //we can also access the entire path by joining  / in between word , except the last
  //word since it popped off before
  const folderToCheck = pathArray.join('/')

  //get dynamicfilename from the folderpath
  const dynamicHandler = await handleDynamicRoutes(folderToCheck)

  if (!dynamicHandler) {
    return res.send('route not found')
  } 
  //setting a new property with value in req parms object , which will be sent
  //when we call handleregularroutes (just below)
req.params = {...req.params , [dynamicHandler.param]: lastElement}
//property acts as key which is city and last elemet its value which is taken 
//from the url
//the property/key name is passed from dynamichandler which calls the function
//handleregularoutes - this function check the folder and gives the file name
//after removing the [] 

//now lets get the files content to send respone to client 
//we will need file path and req and res,
result = await handleRegularRoutes([folderToCheck , dynamicHandler.file].join('/'), req , res);
res.send(result)
} else {
  res.send(result);
}


});

app.listen(3000, () => {
  console.log("server is listening");
});
