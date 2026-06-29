export async function callGeminiAPI(promptText, apiKey, customSystemInstruction = null) {
    // 1. Fetch available models for this specific API Key
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    if (!listRes.ok) {
        throw new Error(`Model listesi alınamadı. Lütfen API anahtarınızın doğru olduğundan emin olun. (Hata: ${listRes.status})`);
    }
    const listData = await listRes.json();
    
    let selectedModel = "";
    if (listData.models) {
        const validModels = listData.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
        
        // Flash modellerin her zaman ücretsiz (free tier) limiti vardır.
        const preferred = validModels.find(m => m.name.includes("flash"));
        // Sadece flash bulunamazsa en temel modeli seç.
        const fallback = validModels.find(m => m.name === "models/gemini-pro" || m.name === "models/gemini-1.5-flash");
        
        if (preferred) selectedModel = preferred.name;
        else if (fallback) selectedModel = fallback.name;
        else if (validModels.length > 0) selectedModel = validModels[0].name;
    }

    if (!selectedModel) {
        throw new Error("Hesabınızda kullanılabilir (generateContent destekleyen) bir Gemini modeli bulunamadı.");
    }
    
    console.log("Seçilen Model:", selectedModel);

    // 2. Make the API Call with the dynamically selected model
    const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;
    
    const defaultInstruction = `Sen uzman bir diyetisyensin. Kullanıcının girdiği yemek metnini analiz et. Yiyecekleri tek tek ayır ve kalorilerini hesapla. SADECE aşağıdaki JSON formatında bir cevap döndür, başka hiçbir açıklama metni veya markdown backtick ( \`\`\` ) kullanma. Tam olarak geçerli bir JSON objesi döndür:
    {
      "items": [
        { "name": "1 Kase Mercimek Çorbası", "calories": 150 },
        { "name": "1 Dilim Ekmek", "calories": 80 }
      ],
      "calories": 230,
      "protein": 10,
      "carbs": 30,
      "fat": 5
    }
    Hesaplayamazsan değerleri 0 dön.`;
    
    const finalInstruction = customSystemInstruction || defaultInstruction;

    const requestBody = {
        contents: [{
            parts: [{ text: `${finalInstruction}\n\nKullanıcı metni: ${promptText}` }]
        }],
        generationConfig: {
            temperature: 0.0,
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`API Hatası (${response.status}): ${errData.error?.message || 'Bilinmeyen hata'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("Yapay zeka boş yanıt döndürdü (Muhtemelen güvenlik filtresine takıldı).");
    }

    let textResult = data.candidates[0].content.parts[0].text;
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        return JSON.parse(textResult);
    } catch (e) {
        throw new Error("Dönen veri JSON formatında değildi: " + textResult);
    }
}
