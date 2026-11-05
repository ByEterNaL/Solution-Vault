# İçeri Aktar (Geri Yükleme / Birleştirme)

Daha önce dışarı aktardığınız bir JSON dosyasını veya başka bir Solution Vault yedeğini mevcut kutunuza geri yükleyebilirsiniz. Bu işlem **akıllı birleştirme** yapar; mevcut verilerinizi silmez, sadece eksik veya güncel kayıtları ekler.

## Nasıl Kullanılır?

1. Sol kenar çubuğunun (Sidebar) en altında bulunan **İçe Aktar** butonuna tıklayın.
2. Açılan pencereden `.json` uzantılı yedek dosyanızı seçin.
3. **Aç** dediğinizde sistem şu şekilde bir bildirim verir:
   > *"İçe aktarıldı (3 yeni, 2 güncel)"*

## Birleştirme Mantığı

| Durum | İşlem |
|-------|-------|
| **Yeni kayıt** (ID daha önce yoksa) | Doğrudan kutuya eklenir. |
| **Güncellenmiş kayıt** (ID var ama yedekteki `updatedAt` daha yeniyse) | Mevcut kayıt yedekteki haliyle güncellenir. |
| **Eski kayıt** (ID var ama yedekteki `updatedAt` daha eskiyse) | Hiçbir değişiklik yapılmaz; mevcut hali korunur. |

Bu sayede aynı dosyayı birden fazla kez içeri aktarsanız bile veri kaybı yaşamazsınız.

## Beklenen Dosya Formatı

Uygulama aşağıdaki yapıdaki dosyaları kabul eder:

```json
{
  "version": 1,
  "exportedAt": 1716031200000,
  "entries": [
    {
      "id": "abc123",
      "title": "Zorunlu alan",
      "problem": "...",
      "solution": "...",
      "category": "...",
      "tags": ["etiket1", "etiket2"],
      "createdAt": 1710000000000,
      "updatedAt": 1716000000000,
      "useCount": 0,
      "lastUsedAt": 1716030000000,
      "isPinned": false
    }
  ]
}
```

- `entries` dizisi boş bile olsa işlem başarılı sayılır.
- `title` ve `id` alanları olmayan kayıtlar atlanır.
- `tags` alanındaki etiketler otomatik olarak temizlenir:
  - Başındaki `#` işareti kaldırılır.
  - Küçük harfe çevrilir.
  - Fazla boşluklar temizlenir.
  - Yinelenen etiketler tekilleştirilir.

## Önemli Notlar

- İçeri aktarma işlemi **geri alınamaz**. Büyük yedek dosyalarında dikkatli olun.
- Yedek dosyanız bozuk veya uyumsuz formatta ise sistem hata verir ve hiçbir veri değişmez.
- Başka birinin Solution Vault yedeğini içeri aktararak ortak bir bilgi tabanı oluşturabilirsiniz.
