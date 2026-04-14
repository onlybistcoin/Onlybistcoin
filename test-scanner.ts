import { readFileSync } from 'fs';

const file = readFileSync('src/App.tsx', 'utf8');
const getAdjustedTechnicalsMatch = file.match(/const getAdjustedTechnicals = \([\s\S]*?};\n/);
if (getAdjustedTechnicalsMatch) {
  console.log("getAdjustedTechnicals found");
} else {
  console.log("getAdjustedTechnicals NOT found");
}
