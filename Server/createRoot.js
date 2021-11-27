const bcrypt = require('bcryptjs');
const saltRounds = 10;
const myPlaintextPassword = 'toor';
bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  console.log(hash);
});
