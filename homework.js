// write a variable that is a string and output to console
let albert = "Hey hey hey";
console.log(albert);


// write a variable that is a number and output to console (hint: it's console.log(variable name))
let myage = 23; //yeah im old
console.log(myage);

// write a variable that takes any two numbers and adds them 
let other = 67;
let sum = other + myage;
console.log(other);

// write a variable that takes any two numbers and subtracts them and output to console
let diff = other - myage;
console.log(diff);

// write a variable that takes any two numbers and performs a modulo that has a value of 1  and output to console 
let mod = 9 % 4;

// write a variable that takes any two numbers and perform an exponential value and output to console 
let exp = 2 ** 7; 
console.log(exp);
// write a statement that is false using a conditional statement and output to console 
let Jordan = "GOAT";
let Lebron = "Good";
let goat = (Lebron === "GOAT"); 
console.log(goat);


// I have created an object below, output to console the value of "breed" (hint: the structure is ObjectName.value you want to call)
// the keyword "this" is self referencing the object 

let siggy = {
    breed : "cat", 
    baby: "big baby", 
    fluffy: "fluffy", 
    output: function() {

        return `Siggy is a ${this.breed} that is a ${this.fluffy} ${this.baby}`

    }
}
console.log(siggy.breed)
// methods! You call methods the same way you call a function.  I'll call siggy.output() below. 

console.log(siggy.output()); 

// copy + paste the siggy object below and rename the variable from Siggy to an animal or name of your choice 
// then, I want you to change the object to the value of your choosing  
let scooby = {
    breed: "dog",
    baby: "scaredy cat",
    fluffy: "scared",
    output: function() {
        return `Scooby is a ${this.breed} that is a ${this.fluffy} ${this.baby}`;
    }
}

// console.log the values of that object one by one. 
console.log(scooby.breed);
console.log(scooby.baby);
console.log(scooby.fluffy);
console.log(scooby.output());
// create an array 
let array = ["why", "cant", "I", "get", "a", "job"];
// call the value in the 3 position of this array and output to console 
console.log(someArray[3]);
let someArray = ["Ishrat", "Is", "Really", "Proud", "Of", "You"];

// call all values in the array using a loop 
for (let i = 0; i < someArray.length; i++) {
    console.log(someArray[i]);
}
// what is the value of the variable ifStatement, leave your answer in the console. 

let ifStatement; 
let value = 5; 

if(value < 5)
{
    ifStatement = true;
}

else{
    ifStatement = false; 
}
console.log(ifStatement);
