import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb'
import path from 'path'

// const articlesInfo = {
//     'learn-react': {
//         upvotes: 0,
//         comments: [],
//     },
//     'learn-node': {
//         upvotes: 0,
//         comments: [],
//     },
//     'my-thoughts-on-resumes': {
//         upvotes: 0,
//         comments: [],
//     }
// }

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
// parse json object we have parsed with post request
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        // Connect to mongodb
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        const db = client.db('reactblog');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error })
    }
}

// app.get('/hello', (req, res) => res.send('Hello'));

// Getting article by name
app.get('/api/articles/:name', async (req, res) => {
    withDB (async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(articlesInfo);
    }, res);
})

// Posting a vote for an article
app.post('/api/articles/:name/upvte', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            // Actual updates 
            '$set': {
                upvtes: articlesInfo.upvtes + 1,
            },
        }, res);
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    })
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);

    // res.status(200).send(articlesInfo[articleName]);
});

// All requests that are caught by any of our API routes should be passed to our app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));