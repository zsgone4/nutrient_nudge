import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ExternalLink, BookOpen, FlaskConical, Wheat, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Citation {
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  description: string;
  url: string;
}

interface CitationSection {
  heading: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  citations: Citation[];
}

const SECTIONS: CitationSection[] = [
  {
    heading: 'Calorie & Energy Calculations',
    icon: null,
    color: '#065F46',
    bgColor: '#D1FAE5',
    citations: [
      {
        title: 'A New Predictive Equation for Resting Energy Expenditure in Healthy Individuals',
        authors: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO',
        journal: 'American Journal of Clinical Nutrition',
        year: '1990',
        description:
          'The Mifflin-St Jeor equation used to calculate your Basal Metabolic Rate (BMR) and daily calorie target.',
        url: 'https://doi.org/10.1093/ajcn/51.2.241',
      },
      {
        title: 'Dietary Reference Intakes for Energy',
        authors: 'National Academies of Sciences, Engineering, and Medicine',
        year: '2023',
        description:
          'Reference values for energy intake and activity level multipliers used to calculate Total Daily Energy Expenditure (TDEE).',
        url: 'https://www.nationalacademies.org/our-work/dietary-reference-intakes-for-energy',
      },
    ],
  },
  {
    heading: 'Micronutrient Daily Values',
    icon: null,
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    citations: [
      {
        title: 'Daily Value on the Nutrition and Supplement Facts Labels',
        authors: 'U.S. Food & Drug Administration (FDA)',
        year: '2024',
        description:
          'The Recommended Daily Values (RDV) used as targets for all 26 vitamins and minerals tracked in this app.',
        url: 'https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels',
      },
      {
        title: 'Dietary Reference Intakes: Vitamins & Minerals',
        authors: 'National Institutes of Health, Office of Dietary Supplements',
        description:
          'Comprehensive fact sheets for individual vitamins and minerals, including health benefits and recommended intake levels.',
        url: 'https://ods.od.nih.gov/factsheets/list-all/',
      },
    ],
  },
  {
    heading: 'Nutrient Health Benefits',
    icon: null,
    color: '#92400E',
    bgColor: '#FEF3C7',
    citations: [
      {
        title: 'MedlinePlus: Vitamins and Minerals',
        authors: 'U.S. National Library of Medicine',
        description:
          'Health function descriptions for vitamins and minerals, including their roles in immune function, bone health, energy production, and more.',
        url: 'https://medlineplus.gov/vitamins.html',
      },
      {
        title: 'Micronutrient Facts',
        authors: 'Centers for Disease Control and Prevention (CDC)',
        description:
          'Information on the role of vitamins and minerals in maintaining health and preventing deficiency.',
        url: 'https://www.cdc.gov/nutrition/micronutrient-malnutrition/micronutrients/index.html',
      },
    ],
  },
  {
    heading: 'Food Nutritional Data',
    icon: null,
    color: '#3730A3',
    bgColor: '#E0E7FF',
    citations: [
      {
        title: 'FoodData Central',
        authors: 'U.S. Department of Agriculture (USDA)',
        description:
          'Nutritional composition data for foods, including macro and micronutrient values per serving.',
        url: 'https://fdc.nal.usda.gov/',
      },
    ],
  },
];

function CitationCard({ citation, delay }: { citation: Citation; delay: number }) {
  const handleOpen = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Linking.openURL(citation.url);
  };

  return (
    <View>
      <Pressable
        onPress={handleOpen}
        className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3"
      >
        <Text className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-1">
          {citation.title}
        </Text>
        {citation.authors && (
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {citation.authors}{citation.year ? ` (${citation.year})` : ''}
          </Text>
        )}
        {citation.journal && (
          <Text className="text-xs text-gray-400 dark:text-gray-500 italic mb-2">
            {citation.journal}
          </Text>
        )}
        <Text className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          {citation.description}
        </Text>
        <View className="flex-row items-center">
          <ExternalLink size={12} color="#10B981" />
          <Text className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5" numberOfLines={1}>
            {citation.url.replace(/^https?:\/\//, '')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function SourcesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  let delayCounter = 0;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Sources & Citations</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Scientific basis for all health information
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
        >
          <X size={18} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Disclaimer */}
        <View
          className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6"
        >
          <Text className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
            Important Disclaimer
          </Text>
          <Text className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            This app provides general nutritional information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making significant changes to your diet.
          </Text>
        </View>

        {SECTIONS.map((section, sectionIdx) => {
          const sectionDelay = 100 + sectionIdx * 60;
          return (
            <View key={section.heading} className="mb-6">
              {/* Section header */}
              <View
                style={{ backgroundColor: section.bgColor }}
                className="rounded-xl px-4 py-3 mb-3"
              >
                <Text className="text-sm font-bold" style={{ color: section.color }}>
                  {section.heading}
                </Text>
              </View>

              {section.citations.map((citation, citIdx) => {
                delayCounter += 1;
                return (
                  <CitationCard
                    key={citation.url}
                    citation={citation}
                    delay={sectionDelay + 40 + citIdx * 60}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
