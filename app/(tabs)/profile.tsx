import { get, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../firebase';

interface Trip {
  score: number;
  seconds: number;
  timestamp: number;
  brakeEvents: number;
  turnEvents: number;
  faceEvents: number;
  mirrorEvents: number;
  speedViolations: number;
}

function scoreTier(score: number) {
  if (score >= 90) return { label: 'Excellent Driver', color: '#16a34a', bg: '#f0fdf4' };
  if (score >= 75) return { label: 'Good Driver',      color: '#ca8a04', bg: '#fefce8' };
  if (score >= 60) return { label: 'Fair Driver',       color: '#ea580c', bg: '#fff7ed' };
  return                  { label: 'High Risk Driver',  color: '#dc2626', bg: '#fef2f2' };
}

function fmtTotalTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(ref(db, 'trips')).then((snap) => {
      if (snap.exists()) {
        const raw = snap.val() as Record<string, Trip>;
        setTrips(Object.values(raw));
      }
      setLoading(false);
    });
  }, []);

  const totalTrips   = trips.length;
  const avgScore     = totalTrips ? Math.round(trips.reduce((s, t) => s + t.score, 0) / totalTrips) : 0;
  const bestScore    = totalTrips ? Math.max(...trips.map((t) => t.score)) : 0;
  const totalSecs    = trips.reduce((s, t) => s + (t.seconds ?? 0), 0);
  const totalBrakes  = trips.reduce((s, t) => s + (t.brakeEvents ?? 0), 0);
  const totalTurns   = trips.reduce((s, t) => s + (t.turnEvents ?? 0), 0);
  const totalMirrors = trips.reduce((s, t) => s + (t.mirrorEvents ?? 0), 0);
  const totalSpeed   = trips.reduce((s, t) => s + (t.speedViolations ?? 0), 0);
  const tier         = scoreTier(avgScore);

  // Score trend — last 5 trips
  const recent = [...trips].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5).reverse();

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#111" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + tier */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🚗</Text>
        </View>
        <Text style={styles.driverLabel}>Driver</Text>
        <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
          <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
        </View>
      </View>

      {/* Big score */}
      <View style={[styles.card, styles.scoreCard]}>
        <Text style={styles.scoreCardLabel}>AVERAGE SCORE</Text>
        <Text style={[styles.scoreCardNum, { color: tier.color }]}>{avgScore}</Text>
        <Text style={styles.scoreCardSub}>out of 100</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${avgScore}%` as any, backgroundColor: tier.color }]} />
        </View>
      </View>

      {/* Key stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Trips"        value={String(totalTrips)}         icon="🗂️" />
        <StatCard label="Best Score"   value={String(bestScore)}          icon="🏆" />
        <StatCard label="Drive Time"   value={fmtTotalTime(totalSecs)}    icon="⏱️" />
        <StatCard label="Speed Alerts" value={String(totalSpeed)}         icon="🚨" />
      </View>

      {/* Behaviour breakdown */}
      <Text style={styles.sectionTitle}>Behaviour Breakdown</Text>
      <View style={styles.card}>
        <BehaviourRow icon="🛑" label="Hard Brakes"       count={totalBrakes}  total={totalTrips} />
        <BehaviourRow icon="↩️" label="Sharp Turns"       count={totalTurns}   total={totalTrips} />
        <BehaviourRow icon="🪞" label="Missed Mirror Checks" count={totalMirrors} total={totalTrips} last />
      </View>

      {/* Recent trend */}
      {recent.length > 1 && (
        <>
          <Text style={styles.sectionTitle}>Recent Trend</Text>
          <View style={[styles.card, styles.trendCard]}>
            {recent.map((t, i) => {
              const h = Math.round((t.score / 100) * 80);
              const c = scoreTier(t.score).color;
              return (
                <View key={i} style={styles.trendCol}>
                  <View style={[styles.trendBar, { height: h, backgroundColor: c }]} />
                  <Text style={styles.trendScore}>{t.score}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BehaviourRow({
  icon, label, count, total, last,
}: {
  icon: string; label: string; count: number; total: number; last?: boolean;
}) {
  const avg = total > 0 ? (count / total).toFixed(1) : '0';
  return (
    <View style={[styles.bRow, !last && styles.bRowBorder]}>
      <Text style={styles.bIcon}>{icon}</Text>
      <View style={styles.bInfo}>
        <Text style={styles.bLabel}>{label}</Text>
        <Text style={styles.bSub}>{avg} per trip avg</Text>
      </View>
      <Text style={styles.bCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f7f7' },
  content: { paddingHorizontal: 20 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText:    { fontSize: 32 },
  driverLabel:   { fontSize: 18, fontWeight: '700', color: '#111' },
  tierBadge:     { marginTop: 6, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  tierText:      { fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreCard:      { alignItems: 'center', marginBottom: 28 },
  scoreCardLabel: { fontSize: 11, fontWeight: '600', color: '#999', letterSpacing: 1.5, textTransform: 'uppercase' },
  scoreCardNum:   { fontSize: 64, fontWeight: '800', letterSpacing: -2, marginTop: 4 },
  scoreCardSub:   { fontSize: 13, color: '#aaa', marginBottom: 16 },
  barTrack:       { width: '100%', height: 6, backgroundColor: '#f0f0f0', borderRadius: 99, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 99 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard:  {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon:  { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 3, fontWeight: '500' },

  bRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  bRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  bIcon:      { fontSize: 20, marginRight: 14 },
  bInfo:      { flex: 1 },
  bLabel:     { fontSize: 14, fontWeight: '600', color: '#111' },
  bSub:       { fontSize: 12, color: '#999', marginTop: 2 },
  bCount:     { fontSize: 18, fontWeight: '700', color: '#111' },

  trendCard: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingBottom: 0 },
  trendCol:  { alignItems: 'center', flex: 1 },
  trendBar:  { width: 28, borderRadius: 6, minHeight: 4 },
  trendScore:{ fontSize: 11, color: '#888', marginTop: 6, fontWeight: '500' },
});
