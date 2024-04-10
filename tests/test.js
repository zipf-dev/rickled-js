const rickle = require('rickled');



let rick = new rickle.BaseRickle({'innerRick' : {'power' : 'whisky'}});

rick.addAttr('number', 2);

rick.addAttr('string', 1);

console.log(rick.toDict());

console.log(rick);

console.log(rick.toJsonString(true));

console.log(rick.get('nothing', 'to see'));

console.log(rick.get('innerRick', 'to see').toJsonString());

rick.innerRick['deeper'] = new rickle.BaseRickle({'deeper_still' : {'jezus' : 'kristis'}});

console.log(rick.toJsonString());

rick.set('/innerRick/deeper/deeper_still/jezus', 'CHRIST!');

console.log(rick.toJsonString());