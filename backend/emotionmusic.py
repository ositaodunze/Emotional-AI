import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from keras.models import Sequential
from keras.layers import Dense
import joblib
import os

os.makedirs("models", exist_ok=True)
df = pd.read_csv("data/dataset.csv")

#Using Russell's Circumplex model of emotion also used by Spotify to characterise tracks
HIGH_VALENCE = 0.6
LOW_VALENCE = 0.4
HIGH_ENERGY = 0.8
MID_ENERGY = 0.6
LOW_ENERGY = 0.4
HIGH_TEMPO = 140
HIGH_LOUD = -5

mood_choices = ["happy","surprise","neutral","sad","angry"]

conditions = [
    #defining happy
    (df['valence'] >= HIGH_VALENCE) & (df['energy'] >= MID_ENERGY),
    #defining sad
    (df['valence'] <= LOW_VALENCE) & (df['energy'] <= LOW_ENERGY),
    #defining angry
    (df['valence'] <= LOW_VALENCE) & (df['energy'] >= LOW_ENERGY),
    #defining surprised
    (df['energy'] >= HIGH_ENERGY) & (df['valence'].between(LOW_VALENCE,HIGH_VALENCE)) & (df['tempo'] >= HIGH_TEMPO) & (df['loudness'] >= HIGH_LOUD),
    #defining neutral
    (df['valence'].between(LOW_VALENCE,HIGH_VALENCE)) & (df['energy'].between(LOW_ENERGY,MID_ENERGY))
]

df['redefined_mood'] = np.select(conditions, mood_choices, default='Unclassified')

#One Hot Encoding (binary)
X_mood = df[['redefined_mood']]
ohe = OneHotEncoder(sparse_output=False)
X_encoded = ohe.fit_transform(X_mood)
X_encoded_df = pd.DataFrame(X_encoded,columns=ohe.get_feature_names_out(X_mood.columns))

#Scale music numerical features
Y_features = df.drop(columns=['redefined_mood','track_id','artists','track_name','album_name','explicit','track_genre'])
scaler_y = StandardScaler()
y_scaled = scaler_y.fit_transform(Y_features)
Y_scaled_df = pd.DataFrame(y_scaled, columns=Y_features.columns)

X = X_encoded_df.values.astype(np.float32)
Y = Y_scaled_df.values.astype(np.float32)
input_dim = X.shape[1]
output_dim = Y.shape[1]

X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
print(f"Input Dimension (Moods): {input_dim}")
print(f"Output Dimension (Features): {output_dim}")

model = Sequential()
model.add(Dense(units=32, input_dim=input_dim, activation='relu',name='Input_Mood_Layer'))
model.add(Dense(units=64, activation='relu', name = 'Hidden_Feature_Mapper'))
model.add(Dense(units=32, activation = 'relu', name='Hidden_Layer_2'))
model.add(Dense(units=output_dim, activation='linear',name='Output_Feature_Vector'))

model.compile(optimizer=tf.keras.optimizers.Adam(),loss=tf.keras.losses.MeanSquaredError(),metrics=[tf.keras.metrics.MeanAbsoluteError()])
model.summary()

history = model.fit(X_train,Y_train,epochs=50,batch_size=32,validation_split=0.1,verbose=0)

#saving encoder, scaler, model
joblib.dump(ohe,"models/mood_encoder.pkl")
joblib.dump(scaler_y,"models/feature_scaler.pkl")
model.save("models/mood_to_features.h5")





