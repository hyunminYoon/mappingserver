let fs = require('fs');
let input = fs.readFileSync('/dev/stdin').toString().split('\n');
console.log(input);
let cost = [];
input.forEach(value => {
  cost.push(Number(value))
});
console.log(cost);

let hamberger = cost[0];
for (let i =1; i< 3; i++){
  if (hamberger > cost[i]){
    hamberger = cost[i];
  }
}
let drink = cost[3];
if (drink > cost[4]){
  drink = cost[4];
}

let sum = hamberger + drink - 50;
console.log(sum);