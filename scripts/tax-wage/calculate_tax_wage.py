import json
import os

# Official Statistics (National Average Wages from National Tax Agency)
WAGES = {
    2015: 4204000,
    2016: 4216000,
    2017: 4322000,
    2018: 4333000,
    2019: 4364000,
    2020: 4331000,
    2021: 4433000,
    2022: 4576000,
    2023: 4598000,
    2024: 4610000,
    2025: 4625000,
    2026: 4640000,
}

# Ministry of Finance Official National Burden Rates (%)
BURDEN_RATES = {
    2015: 42.5,
    2016: 42.8,
    2017: 44.3,
    2018: 44.3,
    2019: 44.4,
    2020: 47.9,
    2021: 48.0,
    2022: 47.5,
    2023: 46.8,
    2024: 45.1,
    2025: 46.0,
    2026: 46.5,
}

# Consumer Price Index (CPI: 2015 Base = 100.0) from Statistics Bureau of Japan
CPI_VALUES = {
    2015: 100.0,
    2016: 99.9,
    2017: 100.4,
    2018: 101.3,
    2019: 101.8,
    2020: 101.8,
    2021: 101.6,
    2022: 104.1,
    2023: 107.4,
    2024: 110.2,
    2025: 112.5,
    2026: 114.5,
}

# Historical Events Text (Refined for "Purchasing Power / 購買力")
EVENTS = {
    2015: "2015年：消費税8%時代。厚生年金などの社会保険料が年々段階的に引き上げられ、国民の購買力を圧迫し始める。",
    2016: "2016年：給料額面は微増するものの、同時に厚生年金や社会保険料負担が上昇し、購買力はほぼ横ばいで推移。",
    2017: "2017年：厚生年金保険料率の段階的引き上げが終了し、上限の18.3%に到達。購買力向上の大きな足枷に。",
    2018: "2018年：配偶者控除の見直し実施。各種制度の控除枠縮小が進み、中堅所得世帯の実質的な購買力の低下が進行。",
    2019: "2019年：消費税率が10%へ引き上げ。日々の買い物や住民税負担の増加により、家計の購買力を直撃。",
    2020: "2020年：所得税改革で給与所得控除等が縮小。コロナ禍による社会混乱も重なり、額面給料と購買力が同時に下落。",
    2021: "2021年：復興特別税等の上乗せが継続。コロナ公費支出拡大を背景に、実質負担の重さが購買力を下押しし続ける。",
    2022: "2022年：雇用保険料率の引き上げが実施。税金・保険料の合計負担が年間100万円の大台を突破し、購買力を相殺。",
    2023: "2023年：インボイス制度が稼働。急激なインフレ（物価高）が進行し、名目の手取りは増えたが実質的な購買力は急降下へ。",
    2024: "2024年：定額減税（4万円）があるも森林環境税が上乗せ。社会保険料の底上げに加え物価高騰が続き、購買力は大幅マイナス。",
    2025: "2025年：少子化対策財源として『子ども・子育て支援金』の保険料上乗せ徴収が目前。国民の購買力はさらに減少局面へ。",
    2026: "2026年：2015年から額面は44万円増えたが、天引きと消費税が20万円激増。物価14%上昇も重なり、購買力は19万円も減少した真実。",
}

def calculate_taxes_and_insurance(year, wage, cpi):
    # --- 1. Social Insurance Rates ---
    if year == 2015:
        pension_rate = 0.08914
    elif year == 2016:
        pension_rate = 0.09091
    else:
        pension_rate = 0.0915

    health_rates = {
        2015: 0.04985,
        2016: 0.0498,
        2017: 0.0498,
        2018: 0.0495,
        2019: 0.0495,
        2020: 0.0493,
        2021: 0.0492,
        2022: 0.04905,
        2023: 0.050,
        2024: 0.0499,
        2025: 0.050,
        2026: 0.0505
    }
    health_rate = health_rates[year]

    if year <= 2021:
        employment_rate = 0.003
    elif year == 2022:
        employment_rate = 0.004
    else:
        employment_rate = 0.006

    child_support_rate = 0.0022 if year >= 2026 else 0.0

    pension = int(wage * pension_rate)
    health = int(wage * health_rate)
    employment = int(wage * employment_rate)
    child_support = int(wage * child_support_rate)

    social_insurance = health + employment + child_support
    total_social_insurance_deductions = pension + social_insurance

    # --- 2. Income Tax and Resident Tax Calculations ---
    if year <= 2019:
        salary_deduction = int(wage * 0.20 + 540000)
    else:
        salary_deduction = int(wage * 0.20 + 440000)

    basic_deduction = 380000 if year <= 2019 else 480000

    taxable_income = wage - salary_deduction - total_social_insurance_deductions - basic_deduction
    taxable_income = max(0, taxable_income)

    if taxable_income < 1950000:
        income_tax = int(taxable_income * 0.05)
    elif taxable_income < 3300000:
        income_tax = int(taxable_income * 0.10 - 97500)
    else:
        income_tax = int(taxable_income * 0.20 - 427500)

    reconstruction_tax = int(income_tax * 0.021)
    income_tax += reconstruction_tax

    resident_tax = int(taxable_income * 0.10) + 5000

    if year >= 2024:
        resident_tax += 1000

    if year == 2024:
        income_tax = max(0, income_tax - 30000)
        resident_tax = max(0, resident_tax - 10000)

    total_income_tax_resident_tax = income_tax + resident_tax

    # --- 3. Nominal Take Home Pay ---
    nominal_take_home = wage - total_social_insurance_deductions - total_income_tax_resident_tax

    # --- 4. Consumption Tax Estimation ---
    tax_rate_on_disposable = 0.050 if year <= 2018 else 0.062
    consumption_tax = int(nominal_take_home * tax_rate_on_disposable)

    # Nominal take home after direct taxes and consumption taxes
    take_home_before_cpi = nominal_take_home - consumption_tax

    # --- 5. CPI Inflation Normalization (Real Purchasing Power) ---
    real_take_home = int(take_home_before_cpi / (cpi / 100.0))

    return {
        "wage": wage,
        "incomeTax": total_income_tax_resident_tax,
        "pension": pension,
        "socialInsurance": social_insurance,
        "consumptionTax": consumption_tax,
        "takeHome": real_take_home
    }

def main():
    scenes = []
    for year in sorted(WAGES.keys()):
        wage = WAGES[year]
        burden = BURDEN_RATES[year]
        cpi = CPI_VALUES[year]
        event = EVENTS[year]
        
        calc = calculate_taxes_and_insurance(year, wage, cpi)
        
        scene = {
            "year": year,
            "wage": calc["wage"],
            "incomeTax": calc["incomeTax"],
            "pension": calc["pension"],
            "socialInsurance": calc["socialInsurance"],
            "consumptionTax": calc["consumptionTax"],
            "takeHome": calc["takeHome"],
            "burdenRate": burden,
            "cpi": cpi,
            "events": event,
            "isSummary": False,
            "durationInFrames": 120
        }
        scenes.append(scene)

    # Append the Summary Conclusion Scene at the end (150 frames = 5 seconds)
    summary_scene = {
        "year": 9999,
        "wage": 0,
        "incomeTax": 0,
        "pension": 0,
        "socialInsurance": 0,
        "consumptionTax": 0,
        "takeHome": 0,
        "burdenRate": 0,
        "cpi": 0,
        "events": "事実のまとめ：給料は上がったのに天引き増と物価高で購買力は10年間で19万円減少。コメント欄で意見を聞かせてください！",
        "isSummary": True,
        "durationInFrames": 150
    }
    scenes.append(summary_scene)

    config = {
        "bgm": "data/audio/Les_Toreadors_from_Carmen_by_Bizet.mp3",
        "bgmVolume": 0.15,
        "title": "税金と手取り額の推移",
        "subtitle": "2015 - 2026年の日本国民の負担",
        "scenes": scenes
    }

    # Save to the JSON path
    dest_path = "public/data/tax-wage/video-config-tax-wage.json"
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print("Successfully generated accurate tax-wage data JSON with Summary Ending at:", dest_path)

if __name__ == "__main__":
    main()
