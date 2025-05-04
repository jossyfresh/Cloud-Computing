// import mongoose from 'mongoose';

// // Post Schema
// const postSchema = new mongoose.Schema({
//   text: {
//     type: String,
//     required: true
//   },
//   author: {
//     type: String,
//     default: 'Anonymous'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   moderationResult: {
//     flagged: Boolean,
//     reason: String,
//     severity: String,
//     confidence: Number,
//     categories: Object,
//     categoryScores: Object
//   },
//   analytics: {
//     views: { type: Number, default: 0 },
//     reports: { type: Number, default: 0 }
//   }
// });

// // Analytics Schema for tracking moderation statistics
// const moderationStatsSchema = new mongoose.Schema({
//   date: { type: Date, default: Date.now },
//   totalPosts: { type: Number, default: 0 },
//   flaggedPosts: { type: Number, default: 0 },
//   categories: {
//     type: Map,
//     of: Number,
//     default: {}
//   },
//   averageConfidence: { type: Number, default: 0 }
// });

// export const Post = mongoose.model('Post', postSchema);
// export const ModerationStats = mongoose.model('ModerationStats', moderationStatsSchema);

// export class DbService {
//   static async connect() {
//     try {
//       await mongoose.connect(process.env.MONGODB_URI);
//       console.log('Connected to MongoDB Atlas');
//     } catch (error) {
//       console.error('MongoDB connection error:', error);
//       throw error;
//     }
//   }

//   static async createPost(postData) {
//     const post = new Post(postData);
//     await post.save();

//     // Update moderation statistics
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     await ModerationStats.findOneAndUpdate(
//       { date: today },
//       {
//         $inc: {
//           totalPosts: 1,
//           flaggedPosts: postData.moderationResult.flagged ? 1 : 0,
//           [`categories.${Object.keys(postData.moderationResult.categories).filter(k => postData.moderationResult.categories[k]).join(',')}`]: 1
//         }
//       },
//       { upsert: true }
//     );

//     return post;
//   }

//   static async getPosts(filter = {}) {
//     return Post.find(filter).sort({ createdAt: -1 });
//   }

//   static async getModerationStats(days = 7) {
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - days);
    
//     return ModerationStats.find({
//       date: { $gte: startDate }
//     }).sort({ date: 1 });
//   }
// }
