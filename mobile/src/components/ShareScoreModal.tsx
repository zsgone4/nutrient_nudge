import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { X, Share2 } from 'lucide-react-native';

interface ShareScoreModalProps {
  visible: boolean;
  onClose: () => void;
  score: number;
  scoreColor: string;
  scoreLabel: string;
  date: string;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color + '25',
        }}
      />
      {/* Colored arc — simulated with 4 overlapping quadrants */}
      {progress > 0 && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: progress >= 0.25 ? color : 'transparent',
            borderRightColor: progress >= 0.5 ? color : 'transparent',
            borderBottomColor: progress >= 0.75 ? color : 'transparent',
            borderLeftColor: progress >= 1 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
      )}
      {/* Score text */}
      <Text style={{ color, fontSize: 48, fontWeight: '800', lineHeight: 52 }}>
        {score}
      </Text>
      <Text style={{ color: '#475569', fontSize: 14, fontWeight: '600', marginTop: -2 }}>
        /100
      </Text>
    </View>
  );
}

export function ShareScoreModal({
  visible,
  onClose,
  score,
  scoreColor,
  scoreLabel,
  date,
}: ShareScoreModalProps) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const formattedDate = (() => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  })();

  const handleShare = async () => {
    try {
      setSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Nutrient Score',
        UTI: 'public.png',
      });
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} onPress={handleClose} />

        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
        >
          {/* Close button */}
          <Pressable
            onPress={handleClose}
            style={{
              position: 'absolute',
              top: 60,
              right: 24,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="white" />
          </Pressable>

          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
            Share Score
          </Text>

          {/* The shareable card — this gets captured */}
          <View ref={cardRef} collapsable={false} style={{ borderRadius: 28, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#080D1A', '#0F172A', '#1A1035']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 300, padding: 28 }}
            >
              {/* Top branding */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scoreColor, marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                  Nutrient Nudge
                </Text>
              </View>

              {/* Score title */}
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 20 }}>
                Micronutrient Score
              </Text>

              {/* Score ring */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <ScoreRing score={score} color={scoreColor} />

                {/* Score label pill */}
                <View style={{
                  marginTop: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: scoreColor + '20',
                  borderWidth: 1,
                  borderColor: scoreColor + '40',
                }}>
                  <Text style={{ color: scoreColor, fontSize: 14, fontWeight: '700' }}>
                    {scoreLabel}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                  <View style={{ width: `${score}%`, height: '100%', backgroundColor: scoreColor, borderRadius: 100 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: '#334155', fontSize: 10, fontWeight: '600' }}>0</Text>
                  <Text style={{ color: '#334155', fontSize: 10, fontWeight: '600' }}>100</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />

              {/* Footer */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#1E293B', fontSize: 10, fontWeight: '600' }}>
                  nutrientnudge.app
                </Text>
                <Text style={{ color: '#334155', fontSize: 10, fontWeight: '500' }}>
                  {formattedDate}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Share button */}
          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={({ pressed }) => ({
              marginTop: 28,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 100,
              backgroundColor: scoreColor,
              opacity: pressed || sharing ? 0.8 : 1,
              minWidth: 200,
              justifyContent: 'center',
            })}
          >
            {sharing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Share2 size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
                  Share to Instagram
                </Text>
              </>
            )}
          </Pressable>

          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
            Opens your share sheet — select Instagram or Stories
          </Text>
        </View>
      </View>
    </Modal>
  );
}
