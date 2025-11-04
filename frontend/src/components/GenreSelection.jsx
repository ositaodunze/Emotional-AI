import React from "react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GenreSelection = () => {
  const [genres, setGenres] = useState([]); //implement later using an API/dataset
  const [selected, setSelected] = useState([]);
  const allGenres = [
     "Pop",
     "Hip-Hop",
     "R&B",
     "Rock",
     "Jazz",
     "Blues",
     "Classical",
     "Country",
     "Reggae",
     "Electronic",
     "House",
     "Techno",
     "EDM",
     "Indie",
     "Metal",
     "K-Pop",
     "Latin",
     "Folk",
     "Disco",
     "Soul",
     "Trap",
     "Gospel",
     "Afrobeats",
     "Dancehall",
     "Punk",
     "Alternative",
     "Opera",
     "Drill",
     "Synthwave",
     "Lo-fi",
   ];

  /*useEffect(() => {
    const fetchGenres =async () => {
      try{
        const res = await fetch("",)
      }
    }
  }
*/
  const handleSelect = (genre) => {
    if (selected.includes(genre)) {
      setSelected(selected.filter((g) => g !== genre));
    } else if (selected.length < 3) {
      setSelected([...selected, genre]);
    }
  };

  const handleContinue = () => {
    alert(`You selected: ${selected.join(", ")}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-6">
      <div className="max-w-3xl w-full bg-white/10 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-4">
          Choose Your Top 3 Favorite Music Genres
        </h1>
        <p className="text-center mb-8 text-sm text-gray-200">
          Pick up to three genres you love the most.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {allGenres.map((genre) => (
            <Card
              key={genre}
              onClick={() => handleSelect(genre)}
              className={`cursor-pointer transition-all text-center p-4 rounded-xl ${
                selected.includes(genre)
                  ? "bg-indigo-600 text-white shadow-lg scale-105"
                  : "bg-white/20 hover:bg-white/30 text-gray-100"
              }`}
            >
              <CardContent className="p-0 font-medium">{genre}</CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={selected.length !== 3}
            className={`px-6 py-2 text-lg rounded-full font-semibold transition ${
              selected.length === 3
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-400 cursor-not-allowed text-gray-700"
            }`}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenreSelection;
