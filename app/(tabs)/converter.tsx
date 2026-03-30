import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { usePricesContext } from "../../context/PricesContext";
import { MISQAL_GRAMS, TROY_OZ_TO_GRAMS, KARAT_PURITY } from "../../constants/units";
import { useInterstitialAd } from "../../components/ads/useInterstitialAd";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/typography";

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR", "KWD", "JOD", "IQD"] as const;

type Tab = "currency" | "gold" | "silver";

type RateMode = "black" | "bank";

type Unit = "oz" | "misqal" | "gram" | "kg";

type Karat = "18K" | "21K" | "24K";

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("en-US", { maximumFractionDigits: decimals });

const formatInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimal = parts[1] ? `.${parts[1].slice(0, 4)}` : "";
  return `${integer}${decimal}`;
};

const parseInput = (value: string) => Number(value.replace(/,/g, "")) || 0;

export default function ConverterScreen() {
  const { data } = usePricesContext();
  const { onConversionPerformed } = useInterstitialAd();
  const { t } = useTranslation();
  const lastConversionRef = useRef<string>("");

  const [tab, setTab] = useState<Tab>("currency");

  const [rateMode, setRateMode] = useState<RateMode>("black");
  const [fromCurrency, setFromCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [toCurrency, setToCurrency] = useState<(typeof CURRENCIES)[number]>("IQD");
  const [amount, setAmount] = useState("1");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [goldKarat, setGoldKarat] = useState<Karat>("21K");
  const [goldUnit, setGoldUnit] = useState<Unit>("misqal");
  const [goldAmount, setGoldAmount] = useState("1");
  const [goldReverse, setGoldReverse] = useState(false);

  const [silverUnit, setSilverUnit] = useState<Unit>("gram");
  const [silverAmount, setSilverAmount] = useState("1");
  const [silverReverse, setSilverReverse] = useState(false);

  const getRate = (currency: string) => {
    if (currency === "IQD") return { buy: 1, sell: 1 };
    if (currency === "USD") {
      const pair = rateMode === "black" ? data?.usdIqdBlack : data?.usdIqdBank;
      return { buy: pair?.buy ?? 0, sell: pair?.sell ?? 0 };
    }
    const pair = data?.otherPairs?.find((p) => p.pair.startsWith(currency));
    return { buy: pair?.buy ?? 0, sell: pair?.sell ?? 0 };
  };

  const conversion = useMemo(() => {
    const amountNum = parseInput(amount);
    if (!amountNum) return { value: 0, buyValue: 0, sellValue: 0 };

    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);

    let iqd = 0;
    if (fromCurrency === "IQD") {
      iqd = amountNum;
    } else {
      iqd = amountNum * (fromRate.buy || 0);
    }

    let result = 0;
    if (toCurrency === "IQD") {
      result = iqd;
    } else {
      result = iqd / (toRate.sell || 1);
    }

    const buyValue = fromCurrency === "IQD" ? amountNum / (toRate.buy || 1) : amountNum * (fromRate.buy || 0);
    const sellValue = fromCurrency === "IQD" ? amountNum / (toRate.sell || 1) : amountNum * (fromRate.sell || 0);

    return { value: result, buyValue, sellValue };
  }, [amount, fromCurrency, toCurrency, rateMode, data?.otherPairs, data?.usdIqdBlack, data?.usdIqdBank]);

  const rateInfo = useMemo(() => {
    const primary =
      fromCurrency !== "IQD"
        ? { currency: fromCurrency, rate: getRate(fromCurrency) }
        : toCurrency !== "IQD"
        ? { currency: toCurrency, rate: getRate(toCurrency) }
        : { currency: "USD", rate: getRate("USD") };

    const buy = formatNumber(primary.rate.buy || 0, 0);
    const sell = formatNumber(primary.rate.sell || 0, 0);
    return t("converter.rateInfo", { currency: primary.currency, buy, sell });
  }, [fromCurrency, toCurrency, rateMode, data?.otherPairs, data?.usdIqdBlack, data?.usdIqdBank, t]);

  const trackConversion = () => {
    const key = `${amount}-${fromCurrency}-${toCurrency}-${rateMode}`;
    if (key !== lastConversionRef.current) {
      onConversionPerformed();
      lastConversionRef.current = key;
    }
  };

  const goldCalc = useMemo(() => {
    if (!data?.gold?.spotUsdPerOz) return null;
    const spotPerGram = data.gold.spotUsdPerOz / TROY_OZ_TO_GRAMS;
    const unitToGrams = { oz: TROY_OZ_TO_GRAMS, misqal: MISQAL_GRAMS, gram: 1, kg: 1000 } as const;
    const rate = rateMode === "black" ? data?.usdIqdBlack?.mid ?? 0 : data?.usdIqdBank?.mid ?? 0;
    const purity = KARAT_PURITY[goldKarat];
    const amountNum = parseInput(goldAmount);

    if (!goldReverse) {
      const grams = amountNum * unitToGrams[goldUnit];
      const pureGrams = grams * purity;
      const usd = pureGrams * spotPerGram;
      const iqd = usd * rate;
      return { usd, iqd, rate };
    }

    const iqd = amountNum;
    const usd = rate ? iqd / rate : 0;
    const pureGrams = spotPerGram ? usd / spotPerGram : 0;
    const grams = purity ? pureGrams / purity : 0;
    const misqal = grams / MISQAL_GRAMS;
    return { usd, iqd, rate, grams, misqal };
  }, [data?.gold?.spotUsdPerOz, data?.usdIqdBlack, data?.usdIqdBank, goldAmount, goldUnit, goldKarat, rateMode, goldReverse]);

  const silverCalc = useMemo(() => {
    if (!data?.silver?.spotUsdPerOz) return null;
    const spotPerGram = data.silver.spotUsdPerOz / TROY_OZ_TO_GRAMS;
    const unitToGrams = { oz: TROY_OZ_TO_GRAMS, misqal: MISQAL_GRAMS, gram: 1, kg: 1000 } as const;
    const rateBlack = data?.usdIqdBlack?.mid ?? 0;
    const rateBank = data?.usdIqdBank?.mid ?? 0;
    const amountNum = parseInput(silverAmount);

    if (!silverReverse) {
      const grams = amountNum * unitToGrams[silverUnit];
      const usd = grams * spotPerGram;
      return { usd, iqdBlack: usd * rateBlack, iqdBank: usd * rateBank };
    }

    const iqd = amountNum;
    const usd = rateBlack ? iqd / rateBlack : 0;
    const grams = spotPerGram ? usd / spotPerGram : 0;
    const kg = grams / 1000;
    return { usd, grams, kg };
  }, [data?.silver?.spotUsdPerOz, data?.usdIqdBlack, data?.usdIqdBank, silverAmount, silverUnit, silverReverse]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("converter.title")}</Text>

      <View style={styles.tabRow}>
        {[
          { key: "currency", label: t("converter.currency") },
          { key: "gold", label: t("converter.gold") },
          { key: "silver", label: t("converter.silver") },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabButton, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key as Tab)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.toggleRow, { marginBottom: 12 }]}>
        <TouchableOpacity
          style={[styles.toggleButton, rateMode === "black" && styles.toggleActive]}
          onPress={() => setRateMode("black")}
        >
          <Text style={styles.toggleText}>{t("converter.blackMarket")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, rateMode === "bank" && styles.toggleActive]}
          onPress={() => setRateMode("bank")}
        >
          <Text style={styles.toggleText}>{t("converter.bankRate")}</Text>
        </TouchableOpacity>
      </View>

      {tab === "currency" && (
        <View style={styles.section}>

          <Text style={styles.label}>{t("converter.from")}</Text>
          <Pressable style={styles.dropdown} onPress={() => setFromOpen(true)}>
            <Text style={styles.dropdownText}>{fromCurrency}</Text>
            <Text style={styles.dropdownChevron}>▾</Text>
          </Pressable>
          <TextInput
            value={amount}
            onChangeText={(v) => {
              const formatted = formatInput(v);
              setAmount(formatted);
              trackConversion();
            }}
            keyboardType="numeric"
            style={styles.inputLarge}
          />

          <TouchableOpacity
            style={styles.swap}
            onPress={() => {
              setFromCurrency(toCurrency);
              setToCurrency(fromCurrency);
              trackConversion();
            }}
          >
            <Text style={styles.swapText}>↕︎ {t("converter.swap")}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{t("converter.to")}</Text>
          <Pressable style={styles.dropdown} onPress={() => setToOpen(true)}>
            <Text style={styles.dropdownText}>{toCurrency}</Text>
            <Text style={styles.dropdownChevron}>▾</Text>
          </Pressable>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t("converter.result")}</Text>
            <Text style={styles.result}>{formatNumber(conversion.value, 2)}</Text>
          </View>
          <Text style={styles.rateInfo}>{rateInfo}</Text>
          <Text style={styles.resultSub}>
            {t("converter.rateBreakdown", { buy: formatNumber(conversion.buyValue, 2), sell: formatNumber(conversion.sellValue, 2) })}
          </Text>
        </View>
      )}

      {tab === "gold" && goldCalc && (
        <View style={styles.section}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { marginBottom: 6 }]}>{t("converter.karat")}</Text>
              <View style={styles.toggleRow}>
                {["18K", "21K", "24K"].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.toggleButton, goldKarat === k && styles.toggleActive]}
                    onPress={() => setGoldKarat(k as Karat)}
                  >
                    <Text style={styles.toggleText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { marginBottom: 6 }]}>{t("converter.unit")}</Text>
              <View style={styles.toggleRow}>
                {["misqal", "gram"].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.toggleButton, goldUnit === u && styles.toggleActive]}
                    onPress={() => setGoldUnit(u as Unit)}
                  >
                    <Text style={styles.toggleText}>{u.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>{goldReverse ? t("converter.iHaveIqd") : t("converter.iHave")}</Text>
          <TextInput
            value={goldAmount}
            onChangeText={(v) => setGoldAmount(formatInput(v))}
            keyboardType="numeric"
            style={styles.input}
          />

          {!goldReverse && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("converter.goldMisqal", { karat: goldKarat })}</Text>
              <Text style={styles.cardValue}>${formatNumber(goldCalc.usd, 2)} USD</Text>
              <Text style={styles.cardSub}>{formatNumber(goldCalc.iqd, 0)} IQD</Text>
            </View>
          )}

          {goldReverse && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("converter.withIqd", { amount: goldAmount })}</Text>
              <Text style={styles.cardSub}>
                {goldKarat} → {formatNumber(goldCalc.misqal ?? 0, 2)} Misqal / {formatNumber(goldCalc.grams ?? 0, 2)}g
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.reverseButton}
            onPress={() => setGoldReverse(!goldReverse)}
          >
            <Text style={styles.reverseText}>
              {goldReverse ? t("converter.normalMode") : t("converter.howMuch")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {tab === "silver" && silverCalc && (
        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 6 }]}>{t("converter.unit")}</Text>
          <View style={styles.toggleRow}>
            {["gram", "kg"].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.toggleButton, silverUnit === u && styles.toggleActive]}
                onPress={() => setSilverUnit(u as Unit)}
              >
                <Text style={styles.toggleText}>{u.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{silverReverse ? t("converter.iHaveIqd") : t("converter.iHave")}</Text>
          <TextInput
            value={silverAmount}
            onChangeText={(v) => setSilverAmount(formatInput(v))}
            keyboardType="numeric"
            style={styles.input}
          />

          {!silverReverse && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("converter.silverValue")}</Text>
              <Text style={styles.cardValue}>${formatNumber(silverCalc.usd, 2)} USD</Text>
              <Text style={styles.cardSub}>{formatNumber(silverCalc.iqdBlack ?? 0, 0)} IQD ({t("converter.blackLabel")})</Text>
              <Text style={styles.cardSub}>{formatNumber(silverCalc.iqdBank ?? 0, 0)} IQD ({t("converter.bankLabel")})</Text>
            </View>
          )}

          {silverReverse && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("converter.withIqd", { amount: silverAmount })}</Text>
              <Text style={styles.cardSub}>
                {formatNumber(silverCalc.kg ?? 0, 3)} Kg / {formatNumber(silverCalc.grams ?? 0, 2)}g
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.reverseButton}
            onPress={() => setSilverReverse(!silverReverse)}
          >
            <Text style={styles.reverseText}>
              {silverReverse ? t("converter.normalMode") : t("converter.howMuch")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={fromOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalSheet} edges={["bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("converter.selectCurrency")}</Text>
            <TouchableOpacity onPress={() => setFromOpen(false)}>
              <Text style={styles.modalClose}>{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listGroup}>
            {CURRENCIES.map((cur, idx) => (
              <TouchableOpacity
                key={`from-${cur}`}
                style={[
                  styles.listRow,
                  idx === CURRENCIES.length - 1 && styles.listRowLast,
                ]}
                onPress={() => {
                  setFromCurrency(cur);
                  setFromOpen(false);
                }}
              >
                <Text style={styles.listTitle}>{cur}</Text>
                {fromCurrency === cur ? (
                  <Text style={styles.listBadge}>{t("converter.selected")}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={toOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalSheet} edges={["bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("converter.selectCurrency")}</Text>
            <TouchableOpacity onPress={() => setToOpen(false)}>
              <Text style={styles.modalClose}>{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listGroup}>
            {CURRENCIES.map((cur, idx) => (
              <TouchableOpacity
                key={`to-${cur}`}
                style={[
                  styles.listRow,
                  idx === CURRENCIES.length - 1 && styles.listRowLast,
                ]}
                onPress={() => {
                  setToCurrency(cur);
                  setToOpen(false);
                }}
              >
                <Text style={styles.listTitle}>{cur}</Text>
                {toCurrency === cur ? (
                  <Text style={styles.listBadge}>{t("converter.selected")}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 22,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 18,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 14,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.surfaceAlt,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  section: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 14,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: COLORS.surfaceAlt,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  dropdownChevron: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  inputLarge: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONTS.semibold,
  },
  swap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  swapText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  result: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: FONTS.bold,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  resultLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  rateInfo: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
  resultSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
    fontFamily: FONTS.regular,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  cardValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
    fontFamily: FONTS.semibold,
  },
  cardSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  reverseButton: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  reverseText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: FONTS.semibold,
  },
  modalSheet: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalHeader: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  modalClose: {
    color: COLORS.primary,
    fontFamily: FONTS.semibold,
  },
  listGroup: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },
  listBadge: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});
