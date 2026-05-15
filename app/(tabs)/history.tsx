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
  if (score >= 90) return { label: 'Excellent', color: '#16a34a', bg: '#f0fdf4' };
  if (score >= 75) return { label: 'Good',      color: '#ca8a04', bg: '#fefce8' };
  if (score >= 60) return { label: 'Fair',       color: '#ea580c', bg: '#fff7ed' };
  return                  { label: 'High Risk',  color: '#dc2626', bg: '#fef2f2' };
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(ref(db, 'trips')).then((snap) => {
      if (snap.exists()) {
        const raw = snap.val() as Record<string, Trip>;
        const arr = Object.values(raw).sort((a, b) => b.timestamp - a.timestamp);
        setTrips(arr);
      }
      setLoading(false);
    });
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Trip History</Text>
      <Text style={styles.pageSubtitle}>{trips.length} trips recorded</Text>

      {loading && (
        <ActivityIndicator style={{ marginTop: 60 }} color="#111" />
      )}

      {!loading && trips.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>Your completed trips will appear here</Text>
        </View>
      )}

      {trips.map((trip, i) => {
        const tier = scoreTier(trip.score);
        return (
          <View key={i} style={styles.card}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardDate}>{fmtDate(trip.timestamp)}</Text>
                <Text style={styles.cardTime}>{fmtTime(trip.timestamp)} · {fmtDuration(trip.seconds)}</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: tier.bg }]}>
                <Text style={[styles.scoreNum, { color: tier.color }]}>{trip.score}</Text>
                <Text style={[styles.scoreTier, { color: tier.color }]}>{tier.label}</Text>
              </View>
            </View>

            {/* Score bar */}
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${trip.score}%` as any, backgroundColor: tier.color }]} />
            </View>

            {/* Events */}
            <View style={styles.events}>
              <EventChip icon="🛑" label={`${trip.brakeEvents ?? 0} brakes`} />
              <EventChip icon="↩️" label={`${trip.turnEvents ?? 0} turns`} />
              <EventChip icon="🪞" label={`${trip.mirrorEvents ?? 0} mirrors`} />
              <EventChip icon="🚨" label={`${trip.speedViolations ?? 0} speed`} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function EventChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f7f7' },
  content: { paddingHorizontal: 20 },

  pageTitle:    { fontSize: 26, fontWeight: '700', color: '#111', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },

  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 17, fontWeight: '600', color: '#111' },
  emptySubtitle:{ fontSize: 13, color: '#999', marginTop: 6 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardDate: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardTime: { fontSize: 12, color: '#999', marginTop: 3 },

  scoreBadge: { alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  scoreNum:   { fontSize: 22, fontWeight: '700' },
  scoreTier:  { fontSize: 10, fontWeight: '600', marginTop: 1 },

  barTrack: { height: 4, backgroundColor: '#f0f0f0', borderRadius: 99, marginBottom: 14, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 99 },

  events:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  chipIcon: { fontSize: 12 },
  chipLabel:{ fontSize: 11, color: '#555', fontWeight: '500' },
});
