console.log("Hypher loaded:", typeof Hypher);
console.log("Hypher languages:", Hypher?.languages);
console.log("English patterns:", Hypher?.languages?.["en-us"]);
function getSyllables(word){
    if (typeof word !== "string" || !word.trim()){
        return [];
    }

    const englishHypher = Hypher.languages["en-us"];
    if (!englishHypher){
        console.error("English hyphenate patterns not loaded")
        return [];
    }
    return englishHypher.hyphenate(word.trim());

}
