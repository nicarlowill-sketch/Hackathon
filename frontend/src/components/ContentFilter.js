import { useState, useEffect } from 'react';

// Simple AI content filter for inappropriate words
const ContentFilter = ({ content, onFilteredContent, children }) => {
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredContent, setFilteredContent] = useState(content);

  // List of inappropriate words/phrases to filter
  const inappropriateWords = [
    // Profanity and offensive language
    'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'asshole',
    'bastard', 'cunt', 'piss', 'crap', 'fucking', 'shitty',
    'damned', 'hellish', 'bitchy', 'asshole', 'bastardly',
    
    // Hate speech and discrimination
    'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
    'gay', 'homo', 'lesbian', 'dyke', 'tranny', 'trans',
    'chink', 'gook', 'wetback', 'spic', 'kike', 'jew',
    'muslim', 'terrorist', 'islamic', 'arab', 'brown',
    
    // Violence and threats
    'kill', 'murder', 'death', 'die', 'suicide', 'bomb',
    'shoot', 'gun', 'weapon', 'knife', 'stab', 'attack',
    'fight', 'beat', 'hurt', 'harm', 'destroy', 'destroyed',
    
    // Sexual content
    'sex', 'sexual', 'porn', 'pornography', 'nude', 'naked',
    'breast', 'boob', 'tit', 'pussy', 'cock', 'dick', 'penis',
    'vagina', 'masturbate', 'orgasm', 'cum', 'sperm',
    
    // Drugs and illegal substances
    'drug', 'cocaine', 'heroin', 'marijuana', 'weed', 'pot',
    'crack', 'meth', 'lsd', 'ecstasy', 'molly', 'pills',
    'high', 'stoned', 'drunk', 'alcohol', 'beer', 'wine',
    
    // Spam and scams
    'free money', 'click here', 'win now', 'guaranteed',
    'no risk', 'limited time', 'act now', 'urgent',
    'congratulations', 'winner', 'prize', 'lottery'
  ];

  // Function to check if content contains inappropriate words
  const containsInappropriateContent = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => {
      // Check for exact word matches and partial matches
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  };

  // Function to filter inappropriate content
  const filterContent = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    let filteredText = text;
    inappropriateWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredText;
  };

  // Filter content when it changes
  useEffect(() => {
    if (!content) {
      setFilteredContent('');
      return;
    }

    setIsFiltering(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      if (containsInappropriateContent(content)) {
        const filtered = filterContent(content);
        setFilteredContent(filtered);
        console.log('Content filtered for inappropriate language');
      } else {
        setFilteredContent(content);
      }
      
      setIsFiltering(false);
    }, 500);
  }, [content]);

  // Pass filtered content to parent
  useEffect(() => {
    if (onFilteredContent) {
      onFilteredContent(filteredContent);
    }
  }, [filteredContent, onFilteredContent]);

  // Show loading state while filtering
  if (isFiltering) {
    return (
      <div className="content-filter-loading">
        <div className="filter-spinner"></div>
        <span>Filtering content...</span>
      </div>
    );
  }

  // Render children with filtered content
  return children ? children(filteredContent) : null;
};

export default ContentFilter;
