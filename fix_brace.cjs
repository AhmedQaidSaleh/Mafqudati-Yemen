const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

// I need to close {!isHumanitarian && ( after the secret section
// The secret section ends at line 1081 (the 3 closing divs).
// We'll replace the closing of the secret section.
// It ends with:
//                     ) : null}
//                   </div>
//                 </div>
//               </div>
// 
//               {isLost && (

const badStr = `                    ) : null}
                  </div>
                </div>
              </div>

              {isLost && (`;

const goodStr = `                    ) : null}
                  </div>
                </div>
              </div>
              )}

              {isLost && (`;

content = content.replace(badStr, goodStr);

// Then remove the mistakenly placed `)}` before `<div className="flex flex-col gap-3 sm:flex-row pt-6">`
const badEnd = `                )}
              </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row pt-6">`;

const goodEnd = `                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row pt-6">`;

content = content.replace(badEnd, goodEnd);

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed braces.");
