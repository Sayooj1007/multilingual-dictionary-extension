chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>{

    if (message.type == "LOOKUP_ENGLISH_WORD"){
        const word = message.word;

        if (typeof word !== "string" || !word.trim()){
            sendResponse({
                success: false,
                error: "Invalid word."
            });
            return;
        }

        fetchDictionary(word.trim())
            .then(data =>{
                sendResponse({
                    success: true,
                    data: data
                });
            })

            .catch(error =>{
                console.log("Dictionary error:", error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        return true;
    }
});

async function fetchDictionary(word){

    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

    let response;

    try{
        response = await fetch(url);
    }catch (error){
        throw new Error("Unable to connect to dictionary server.")
    }

    if (response.status == 404){
        throw new Error("No definiton found for this word.");
    }

    if (!response.ok){
        throw new Error(`Dictionary API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length == 0){
        throw new Error("No dictionary result found.");
    }

    return data;
}


