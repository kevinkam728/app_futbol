import React, { useState } from 'react';

import { Image, View, StyleSheet } from 'react-native';



export default function TeamCrest({ teamId, size = 30 }) {

const [error, setError] = useState(false);

if (!teamId || error) {

return <View style={[styles.placeholder, { width: size, height: size }]} />;

}



return (

<Image

source={{ uri: `https://api.sofascore.app/api/v1/team/${teamId}/image` }}

style={{ width: size, height: size }}

resizeMode="contain"

onError={() => setError(true)}

/>

);

}



const styles = StyleSheet.create({

placeholder: {

backgroundColor: '#475569', // Color de fondo temporal

borderRadius: 5,

},

});