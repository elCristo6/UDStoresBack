const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://root:91120152349.@udelectronicsdatabase.hyemxyz.mongodb.net/databaseUD?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Base de datos databaseUD conectada");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        process.exit(1); // Detiene la aplicación si hay un error
    }
};
module.exports = connectDB;