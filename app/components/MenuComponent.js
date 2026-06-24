import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTeam } from '../../services/TeamContext';



export default function MenuComponent({ visible, onClose, onNavigate }) {

const { setSelectedTeam } = useTeam();

const insets = useSafeAreaInsets();



const options = [

{ label: 'Elegir mi Equipo', action: () => { onClose(); onNavigate('Onboarding'); } },

{ label: 'Ver Torneos', action: () => { onClose(); onNavigate('Tournaments'); } },

{ label: 'Estadísticas', action: onClose },

{ label: 'Mi Perfil', action: onClose },

{ label: 'Configuración', action: onClose },

];



return (

<Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>

<View style={[styles.overlay, { paddingTop: insets.top }]}>

<View style={styles.menu}>

{options.map((opt, i) => (

<TouchableOpacity key={i} style={styles.menuItem} onPress={opt.action}>

<Text style={styles.menuText}>{opt.label}</Text>

</TouchableOpacity>

))}

<TouchableOpacity style={styles.closeButton} onPress={onClose}>

<Text style={styles.closeText}>Cerrar</Text>

</TouchableOpacity>

</View>

</View>

</Modal>

);

}



const styles = StyleSheet.create({

overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-start' },

menu: { width: 250, height: '100%', backgroundColor: '#1E293B', padding: 20 },

menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },

menuText: { color: '#F8FAFC', fontSize: 16 },

closeButton: { marginTop: 20, alignItems: 'center' },

closeText: { color: '#ef4444', fontWeight: 'bold' },

});