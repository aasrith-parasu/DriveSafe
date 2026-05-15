import { useRouter } from 'expo-router';
import { get, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
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
  if (score >= 90) return { label: 'Excellent', color: '#16a34a' };
  if (score >= 75) return { label: 'Good',      color: '#ca8a04' };
  if (score >= 60) return { label: 'Fair',       color: '#ea580c' };
  return                  { label: 'High Risk',  color: '#dc2626' };
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [trips, setTrips]   = useState<Trip[]>([]);
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

  const avgScore = trips.length
    ? Math.round(trips.reduce((s, t) => s + t.score, 0) / trips.length)
    : null;
  const bestScore = trips.length ? Math.max(...trips.map((t) => t.score)) : null;
  const lastTrip  = trips[0] ?? null;
  const tier      = avgScore != null ? scoreTier(avgScore) : null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting} 👋</Text>
        <Text style={styles.subtitle}>Here's your driving overview</Text>
      </View>

      {/* Start Drive CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/live')}
      >
        <View>
          <Text style={styles.ctaTitle}>Start a Trip</Text>
          <Text style={styles.ctaSubtitle}>Tap to begin monitoring</Text>
        </View>
        <View style={styles.ctaArrow}>
          <Text style={styles.ctaArrowText}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Stats row */}
      {!loading && trips.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statValue}>{trips.length}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text style={[styles.statValue, { color: tier?.color }]}>{avgScore}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Text style={styles.statValue}>{bestScore}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </GlassCard>
          </View>

          {/* Last trip */}
          <Text style={styles.sectionTitle}>Last Trip</Text>
          <GlassCard style={styles.lastTripCard}>
            <View style={styles.lastTripRow}>
              <View>
                <Text style={styles.lastTripDate}>{fmtDate(lastTrip.timestamp)}</Text>
                <Text style={styles.lastTripDuration}>{fmtDuration(lastTrip.seconds)}</Text>
              </View>
              <View style={styles.lastTripScoreWrap}>
                <Text style={[styles.lastTripScore, { color: scoreTier(lastTrip.score).color }]}>
                  {lastTrip.score}
                </Text>
                <Text style={[styles.lastTripTier, { color: scoreTier(lastTrip.score).color }]}>
                  {scoreTier(lastTrip.score).label}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.eventRow}>
              <EventBadge icon="🛑" label="Brakes"  count={lastTrip.brakeEvents ?? 0} />
              <EventBadge icon="↩️" label="Turns"   count={lastTrip.turnEvents ?? 0} />
              <EventBadge icon="🪞" label="Mirrors" count={lastTrip.mirrorEvents ?? 0} />
              <EventBadge icon="🚨" label="Speed"   count={lastTrip.speedViolations ?? 0} />
            </View>
          </GlassCard>
        </>
      )}

      {!loading && trips.length === 0 && (
        <GlassCard style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>Start your first trip to see your stats here</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

function EventBadge({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={styles.badgeCount}>{count}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f7f7' },
  content: { paddingHorizontal: 20 },

  header:   { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#111', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },

  ctaCard: {
    backgroundColor: '#111',
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  ctaTitle:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  ctaSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  ctaArrow:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ctaArrowText:{ fontSize: 18, color: '#fff' },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue:{ fontSize: 28, fontWeight: '700', color: '#111' },
  statLabel:{ fontSize: 11, color: '#999', marginTop: 4, fontWeight: '500' },

  lastTripCard: { marginBottom: 28 },
  lastTripRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lastTripDate: { fontSize: 15, fontWeight: '600', color: '#111' },
  lastTripDuration: { fontSize: 13, color: '#888', marginTop: 3 },
  lastTripScoreWrap:{ alignItems: 'flex-end' },
  lastTripScore:    { fontSize: 32, fontWeight: '700' },
  lastTripTier:     { fontSize: 12, fontWeight: '600', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },

  eventRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge:      { alignItems: 'center', flex: 1 },
  badgeIcon:  { fontSize: 18 },
  badgeCount: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 4 },
  badgeLabel: { fontSize: 10, color: '#999', marginTop: 2, fontWeight: '500' },

  emptyCard:    { alignItems: 'center', paddingVertical: 40, marginTop: 20 },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 17, fontWeight: '600', color: '#111' },
  emptySubtitle:{ fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' },

  // Glassy card
  glass: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
});
