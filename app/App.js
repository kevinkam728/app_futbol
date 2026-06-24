import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TeamProvider } from '../services/TeamContext';
import OnboardingScreen from './index';
import DashboardScreen from './screens/DashboardScreen';
import FormationScreen from './screens/FormationScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import MatchInfoScreen from './screens/MatchInfoScreen';
import TournamentsScreen from './screens/TournamentsScreen';
import TournamentDetailScreen from './screens/TournamentDetailScreen';
import MatchDetailScreen from './screens/MatchDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <TeamProvider>
        <NavigationContainer independent={true}>
          <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Elegir Equipo' }} />
            <Stack.Screen name="Formation" component={FormationScreen} options={{ title: 'Armar 11 Ideal' }} />
            <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Comparativa' }} />
            <Stack.Screen name="MatchInfo" component={MatchInfoScreen} options={{ title: 'Previa del Partido' }} />
            <Stack.Screen name="Tournaments" component={TournamentsScreen} options={{ title: 'Torneos' }} />
            <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ title: 'Detalle' }} />
            <Stack.Screen 
              name="MatchDetail" 
              component={MatchDetailScreen} 
              options={{ title: 'Info del Partido', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </TeamProvider>
    </SafeAreaProvider>
  );
}
