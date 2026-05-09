import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FONTS } from '../lib/fonts';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api';
import { notifyError } from '../lib/notifications';
import { ChevronLeft, TrendingUp, Calendar } from 'lucide-react-native';

interface Subscription {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  frequency: string;
  lastSeenAt: string;
  firstSeenAt: string;
}

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function SubscriptionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { subId } = route.params as { subId: string };

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<Subscription>(`/api/subscriptions/${subId}`);
        setSub(data);

        const hist = await apiGet<any[]>(`/api/subscriptions/${subId}/history`);
        if (Array.isArray(hist)) setHistory(hist);
      } catch (err) {
        notifyError(err, "Failed to load subscription details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [subId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  if (!sub) return <View style={styles.center}><Text>Subscription not found</Text></View>;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{sub.merchantName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Current Rate</Text>
          <Text style={styles.heroAmount}>{fmt(sub.amount, sub.currency)}</Text>
          <Text style={styles.heroFreq}>{sub.frequency.toUpperCase()}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Calendar color="#64748b" size={18} />
            <Text style={styles.statLabel}>Since</Text>
            <Text style={styles.statVal}>{new Date(sub.firstSeenAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingUp color="#059669" size={18} />
            <Text style={styles.statLabel}>Annual</Text>
            <Text style={styles.statVal}>{fmt(sub.amount * (sub.frequency === 'annual' ? 1 : sub.frequency === 'monthly' ? 12 : 52), sub.currency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment History</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>No history available for this subscription</Text>
        ) : (
          history.map((item, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.historyAmount}>{fmt(item.amount, sub.currency)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', fontFamily: FONTS.bold },
  container: { flex: 1 },
  content: { padding: 16 },
  heroCard: { backgroundColor: '#059669', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  heroLabel: { color: '#a7f3d0', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, fontFamily: FONTS.bold },
  heroAmount: { color: '#fff', fontSize: 32, fontWeight: '800', fontFamily: FONTS.bold },
  heroFreq: { color: '#fff', fontSize: 14, opacity: 0.8, marginTop: 4, fontFamily: FONTS.regular },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 8, marginBottom: 4, fontFamily: FONTS.regular },
  statVal: { fontSize: 15, fontWeight: '600', color: '#0f172a', fontFamily: FONTS.bold },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12, fontFamily: FONTS.bold },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyDate: { fontSize: 14, color: '#64748b', fontFamily: FONTS.regular },
  historyAmount: { fontSize: 14, fontWeight: '600', color: '#0f172a', fontFamily: FONTS.bold },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 20, fontFamily: FONTS.regular },
});
