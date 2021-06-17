import cors from "cors"
import express from "express"
import pg from "pg"

const {Pool} = pg

const app = express()
app.use(cors())
app.use(express.json());

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
})

//LISTAR CATEGORIAS
app.get("/categories", async (req,res)=>{
    const result= await connection.query('SELECT * FROM categories')
    console.log(result.rows)
    res.send(result.rows)
})

//ADICIONAR CATEGORIA
app.post("/categories", async (req,res)=>{
    const newCategory=req.body.name;
    console.log(req.body)
    const result= await connection.query('INSERT INTO categories (name) VALUES ($1)',[newCategory])
    console.log(result)
})


//LISTAR JOGOS
app.get("/games", async (req,res)=>{
    const result= await connection.query('SELECT * FROM games')
    console.log(result.rows)
    res.send(result.rows)
})


//ADICIONAR JOGOS
app.post("/games", async (req,res)=>{
    const newGame=req.body;
    console.log(req.body)
    try{
        const result= await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1,$2,$3,$4,$5)',[newGame.name,newGame.image,newGame.stockTotal,newGame.categoryId,newGame.pricePerDay])
        console.log(result)
        res.send(result)
    }catch(e){
        console.log(e)
    }
    
})


app.listen(4000, ()=>{
    console.log("Server running on port 4000") 
})