import json
from playwright.sync_api import sync_playwright

def scrape_sabah_halal():
    print("Memulakan pengumpulan data restoran halal di Sabah...")
    sabah_restaurants = []

    with sync_playwright() as p:
        # Jalankan pelayar Chromium secara headless di awan
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Layari portal rasmi MYeHALAL
        page.goto("https://myehalal.halal.gov.my/portal-halal/v1", timeout=60000)
        page.wait_for_load_state("networkidle")

        try:
            # Tapis kategori 'Premis Makanan' dan Negeri 'Sabah'
            page.select_option("select#category", label="Premis Makanan")
            page.select_option("select#state", label="Sabah")
            page.click("button#search-btn")
            page.wait_for_timeout(4000)
        except Exception as e:
            print(f"Perhatian borang carian: {e}")

        # Ekstrak rekod dari jadual
        rows = page.query_selector_all("table tbody tr")
        idx = 1
        for row in rows:
            cols = [c.inner_text().strip() for c in row.query_selector_all("td")]
            if len(cols) >= 4:
                item = {
                    "id": idx,
                    "name": cols,
                    "company": cols[5] if len(cols) > 1 else "",
                    "certNo": cols[6] if len(cols) > 2 else "SPHM-SABAH",
                    "expiry": cols[7] if len(cols) > 3 else "Aktif",
                    "state": "Sabah",
                    "address": (cols[5] if len(cols) > 1 else cols) + ", Sabah",
                    # Koordinat laluan (default sekitar Kota Kinabalu)
                    "lat": 5.9804 + (idx * 0.0015),
                    "lng": 116.0735 + (idx * 0.0015)
                }
                sabah_restaurants.append(item)
                idx += 1

        browser.close()

    # Simpan hasil carian ke fail restaurants.json
    with open("restaurants.json", "w", encoding="utf-8") as f:
        json.dump(sabah_restaurants, f, ensure_ascii=False, indent=2)

    print(f"Selesai! Sebanyak {len(sabah_restaurants)} rekod premis halal Sabah telah dikemas kini.")

if __name__ == "__main__":
    scrape_sabah_halal()
