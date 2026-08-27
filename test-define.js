const key = (typeof process !== "undefined" && "MY_KEY") || "fallback";
console.log(key);
