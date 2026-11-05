# Dışarı Aktar (Yedekleme)

**Solution Vault** içindeki tüm kayıtlarınızı tek bir JSON dosyasına dışarı aktarabilirsiniz. Bu özellik verilerinizi yedeklemek veya başka bir cihaza taşımak için kullanılır.

## Nasıl Kullanılır?

1. Sol kenar çubuğunun (Sidebar) en altında bulunan **Dışa Aktar** butonuna tıklayın.
2. Açılan pencerede kaydetmek istediğiniz konumu seçin.
3. Varsayılan dosya adı `solution-vault-YYYY-AA-GG.json` şeklindedir; isterseniz değiştirebilirsiniz.
4. **Kaydet** dediğinizde işlem tamamlanır ve ekranın alt sağ köşesinde şu şekilde bir bildirim görürsünüz:
   > *"15 kayıt dışa aktarıldı"*

## Çıktı Formatı

Oluşturulan dosya aşağıdaki yapıdadır:

```json
{
  "version": 1,
  "exportedAt": 1716031200000,
  "entries": [
    {
      "id": "abc123",
      "title": "Hata çözümü",
      "problem": "...",
      "solution": "...",
      "category": "Backend",
      "tags": ["node", "api"],
      "createdAt": 1710000000000,
      "updatedAt": 1716000000000,
      "useCount": 5,
      "lastUsedAt": 1716030000000,
      "isPinned": true
    }
  ]
}
```

- `version`: Dosya formatının sürümüdür (şu an `1`).
- `exportedAt`: Dışarı aktarılma zaman damgası (milisaniye cinsinden).
- `entries`: Tüm kayıtlarınızı içeren dizidir.

## Önemli Notlar

- Dışarı aktarma **varolan verileri silmez**, sadece bir kopya oluşturur.
- Dosya formatı `JSON` olduğu için herhangi bir metin düzenleyici ile açılıp incelenebilir.
- Yedek dosyanızı güvenli bir konumda (bulut, harici disk vb.) saklamanız önerilir.
