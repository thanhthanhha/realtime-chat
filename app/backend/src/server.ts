// src/server.ts

import app from './app';


console.log(process.env.AWS_ACCESS_KEY_ID)

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});