const scriptRules = [
    {
        name : "Malayalam",
        regex: /\p{Script=Malayalam}/u,
        languages: ["ml"]
    },
    {
        name: "Devanagari",
        regex: /\p{Script=Devanagari}/u,
        languages: ["hi", "mr", "ne", "sa"]
    },
    {
        name: "Tamil",
        regex: /\p{Script=Tamil}/u,
        languages: ["ta"]
    },
        {
        name: "Telugu",
        regex: /\p{Script=Telugu}/u,
        languages: ["te"]
    },
    {
        name: "Kannada",
        regex: /\p{Script=Kannada}/u,
        languages: ["kn"]
    },
    {
        name: "Bengali",
        regex: /\p{Script=Bengali}/u,
        languages: ["bn", "as"]
    },
    {
        name: "Gujarati",
        regex: /\p{Script=Gujarati}/u,
        languages: ["gu"]
    },
    {
        name: "Gurmukhi",
        regex: /\p{Script=Gurmukhi}/u,
        languages: ["pa"]
    },
    {
        name: "Arabic",
        regex: /\p{Script=Arabic}/u,
        languages: ["ar", "fa", "ur"]
    },
    {
        name: "Hebrew",
        regex: /\p{Script=Hebrew}/u,
        languages: ["he"]
    },
    {
        name: "Cyrillic",
        regex: /\p{Script=Cyrillic}/u,
        languages: ["ru", "uk", "bg"]
    },
    {
        name: "Greek",
        regex: /\p{Script=Greek}/u,
        languages: ["el"]
    },
    {
        name: "Thai",
        regex: /\p{Script=Thai}/u,
        languages: ["th"]
    },
    {
        name: "Hangul",
        regex: /\p{Script=Hangul}/u,
        languages: ["ko"]
    },
    {
        name: "Han",
        regex: /\p{Script=Han}/u,
        languages: ["zh", "ja"]
    },
    {
        name: "Hiragana",
        regex: /\p{Script=Hiragana}/u,
        languages: ["ja"]
    },
    {
        name: "katakana",
        regex: /\p{Script=Katakana}/u,
        languages: ["ja"]
    },
    {
        name: "Latin",
        regex: /\p{Script=Latin}/u,
        languages: []
    }
];

function detectScript(word){
    if (typeof word !== "string" || !word.trim()){
        return{
            script: "Unknown",
            languages: [],
            confidence: "none"
        };
    }

    const detectedScripts = scriptRules.filter(rule => 
        [...word].some(character => rule.regex.test(character))
    );

    if(detectedScripts.length == 0){
        return{
            script: "Unknown",
            languages: [],
            confidence: "none"
        };
    }

    if(detectedScripts.length > 1){
        return{
            script: "Mixed",
            languages: [],
            confidence: "uncertain"
        };
    }

    const detected = detectedScripts[0];
    return{
        script: detected.name,
        languages: detected.languages,
        confidence: "script-based"
    };
}

function detectLanguage(word, pageLanguage = null){
    if (typeof word !== "string" || !word.trim()){
        return{
            language: null,
            code: null,
            source: "none",
            confidence: "none",
            candidates: []
        };
    }

    const scriptResult = detectScript(word.trim());

    if (scriptResult.script === "Unknown" || scriptResult.script === "Mixed"){
        return{
            language: "null",
            code: "null",
            source: "script",
            confidence: "uncertain",
            candidates: []
        };
    }
    const candidates = scriptResult.languages;

    if (candidates.length == 1){
        return{
            language: candidates[0],
            code: candidates[0],
            source: "script",
            confidence: "high",
            candidates
        };
    }

    if (pageLanguage){
        const pageCode = pageLanguage.trim()
            .toLowerCase()
            .split("-")[0];
        
        if (candidates.includes(pageCode)){
            return{
                language: pageCode,
                code: pageCode,
                source: "page-context",
                confidence: "probable",
                candidates
            };
        }
    }

    return{
        language: null,
        code: null,
        source: "dictionary",
        confidence: "uncertain",
        candidates
    };
}

function getPageLanguage(selection){
    if (!selection || selection.rangeCount === 0){
        return null;
    }

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;

    // selected content is a text node get its parent html element
    if (element.nodeType === Node.TEXT_NODE){
        element = element.parentElement;
    }
    // check nearest element with lang attribute
    const languageElement = element?.closest("[Lang]");
    
    const language = languageElement?.getAttribute("lang") ||
        document.documentElement.getAttribute("lang");
    
    return language?.trim() || null;
}