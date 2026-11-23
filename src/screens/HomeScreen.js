import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import GradientButton from '../components/GradientButton';
import { colors, fonts, gradientProps, CATEGORIES } from '../theme';
import { useApp } from '../context/AppContext';

// ---- Hero: recuadro degradado fijo detrás de la chica (proporciones del prototipo) ----
const HERO_IMG = require('../../assets/hero.png'); // PNG de la chica sin fondo
const HERO_H = 240; // alto del recuadro (cambia solo este número para agrandar o achicar todo)
const HERO_G = 500;
let heroAspect = 0.8; // ancho / alto de la imagen; se lee del archivo si es posible
try {
  const src = Image.resolveAssetSource(HERO_IMG);
  if (src && src.width && src.height) heroAspect = src.width / src.height;
} catch (e) {}

export default function HomeScreen({ navigate, onlyFavorites = false }) {
  const { products, favorites } = useApp();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState('Todas');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('none');
  const [selectedId, setSelectedId] = useState(null);

  const cardWidth = (width - 16 * 2 - 12) / 2;
  const selected = products.find((p) => p.id === selectedId) || null;

  // Búsqueda + categoría + orden se aplican en conjunto (HU04, HU05, HU06)
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === 'Todas' || p.category === category) &&
        p.name.toLowerCase().includes(q) &&
        (!onlyFavorites || favorites.includes(p.id))
    );
    if (sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, query, sort, onlyFavorites, favorites]);

  const clearFilters = () => {
    setCategory('Todas');
    setQuery('');
    setSort('none');
  };

  const hasFilters = category !== 'Todas' || query.trim() !== '' || sort !== 'none';

  const ListHeader = (
    <View>
      {!onlyFavorites && (
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.orange, colors.yellow]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroBar}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>¡ TODO LO QUE NECESITAS, EN UN SOLO LUGAR !</Text>
            <Text style={styles.heroSub}>
              Explora productos de moda, belleza, deporte y mascotas. Descubre nuevas
              opciones y encuentra tus favoritos.
            </Text>
            <GradientButton
              onPress={clearFilters}
              style={{ alignSelf: 'flex-start', marginTop: 10 }}
              textStyle={{ fontSize: 15 }}
              right={<Ionicons name="arrow-forward" size={22} color="#000" style={{ marginLeft: 14 }} />}
              label="Compra ahora"
            />
          </View>
          <View style={styles.heroPic}>
            {/* Recuadro naranja → amarillo, pegado a la derecha */}
            <LinearGradient
              colors={[colors.orange, colors.yellow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBox}
            />
            {/* La chica va encima, alineada abajo y a la izquierda: sobresale del recuadro */}
            <Image source={HERO_IMG} style={styles.heroGirl} resizeMode="contain" />
          </View>
        </View>
      )}

      {onlyFavorites && <Text style={styles.favTitle}>MIS FAVORITOS</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
        {CATEGORIES.map((c) => {
          const active = c === category;
          const label = <Text style={styles.chipText}>{c}</Text>;
          return (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} activeOpacity={0.8} style={{ marginRight: 10 }}>
              {active ? (
                <LinearGradient {...gradientProps} style={styles.chip}>{label}</LinearGradient>
              ) : (
                <View style={[styles.chip, { backgroundColor: colors.card }]}>{label}</View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

    </View>
  );

  // Estados vacíos (HU03 CA03, HU04 CA03, HU08 CA03, HU16 CA03)
  const renderEmpty = () => {
    if (products.length === 0) {
      return <EmptyState icon="storefront-outline" text="Aún no hay productos disponibles." />;
    }
    if (onlyFavorites && favorites.length === 0) {
      return (
        <EmptyState
          icon="heart-outline"
          text="Aún no tienes productos favoritos."
          action="Ver catálogo"
          onAction={() => navigate('home')}
        />
      );
    }
    return (
      <EmptyState
        icon="search-outline"
        text="No encontramos productos"
        action={hasFilters ? 'Limpiar filtros' : null}
        onAction={clearFilters}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        variant="home"
        sort={sort}
        onSort={setSort}
        query={query}
        onQuery={setQuery}
        navigate={navigate}
      />
      <View style={{ flex: 1 }}>
        <FlatList
          data={data}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={ListHeader}
          ListHeaderComponentStyle={{ marginBottom: 14 }}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <ProductCard product={item} width={cardWidth} onPress={(p) => setSelectedId(p.id)} />
          )}
        />
        {selected && (
          <ProductModal key={selected.id} product={selected} onClose={() => setSelectedId(null)} />
        )}
      </View>
    </View>
  );
}

export function EmptyState({ icon, text, action, onAction }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={54} color={colors.orange} />
      <Text style={styles.emptyText}>{text}</Text>
      {action ? (
        <GradientButton label={action} onPress={onAction} style={{ marginTop: 14 }} textStyle={{ fontSize: 15 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', minHeight: 180 },
  heroBar: { width: 7, alignSelf: 'stretch', borderRadius: 4, marginRight: 10, marginVertical: 8 },
  heroText: { flex: 1, paddingRight: 6 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#000', lineHeight: 26 },
  heroSub: { fontFamily: fonts.regular, fontSize: 12, color: '#000', marginTop: 6, lineHeight: 18 },
  heroPic: { width: HERO_H * 1.16, height: HERO_H },
  heroBox: { position: 'absolute', right: 0, top: 0, bottom: 0, width: HERO_H * 0.88, borderRadius: 20 },
  heroGirl: { position: 'absolute', right: 30, bottom: 0, height: HERO_H, width: HERO_G * heroAspect },
  favTitle: { fontFamily: fonts.bold, fontSize: 26, color: colors.orange },
  chip: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 22 },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: '#000' },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyText: { fontFamily: fonts.medium, fontSize: 16, color: '#000', textAlign: 'center', marginTop: 10 },
});