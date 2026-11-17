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

function getPageLanguage(selection){
    if(!selection || selection.rangeCount == 0){
        return null;
    }
    const range =  selection.getRangeAt(0);
    let element = range.commonAncestorContainer;

    if(element.nodeType == Node.TEXT_NODE){
        element = element.parentElement;
    }

    const languageElement = element?.closest("[lang]");

    const language = languageElement?.getAttribute("lang") || document.documentElement.getAttribute("lang");
    return language?.trim() || null;
}