import cors from "cors"
import express from "express"
import pg from "pg"
import joi from "joi"

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
    const validatedCategory = categorySchema.validate(req.body)
    const newCategory = validatedCategory.value
    if(validatedCategory.error){
        //res.send(validatedCategory.error.details[0].message)
        res.sendStatus(400)
        return
    }
    try{
        const categoryExists= await connection.query('SELECT * FROM categories WHERE name LIKE $1',[newCategory])
        if(categoryExists.rows.length>0){
            res.sendStatus(409)
            return
        }
        await connection.query('INSERT INTO categories (name) VALUES ($1)',[newCategory])
        res.sendStatus(201)
    } catch(e){
        console.log(e)
    }
})

const categorySchema = joi.object({
    name: joi.string().min(1).required().trim()
})

//LISTAR JOGOS
app.get("/games", async (req,res)=>{
    const result= await connection.query('SELECT * FROM games')
    console.log(result.rows)
    res.send(result.rows)
})


//ADICIONAR JOGOS
app.post("/games", async (req,res)=>{
    const validatedGame= gamesSchema.validate(req.body)
    if(validatedGame.error){
        res.sendStatus(400)
        return
    }
    const newGame= validatedGame.value
    try{
        const categoryExists= await connection.query('SELECT * FROM categories WHERE id = $1',[newGame.categoryId])
        if (!categoryExists.rows.length){
            res.sendStatus(400)
            return
        }
        const gameExists= await connection.query('SELECT * FROM games WHERE name = $1',[newGame.name])
        if (gameExists.rows.length){
            res.sendStatus(409)
            return
        }
        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1,$2,$3,$4,$5)',[newGame.name,newGame.image,newGame.stockTotal,newGame.categoryId,newGame.pricePerDay])
        res.sendStatus(201)
    }catch(e){
        console.log(e)
    }
})

const gamesSchema = joi.object({
    name: joi.string().min(1).required().trim(),
    image: joi.string().min(1).required().trim(),
    stockTotal: joi.number().integer().min(1).required(),
    categoryId: joi.number().integer().min(1).required(),
    pricePerDay: joi.number().integer().min(1).required()
})

//LISTAR CLIENTES
app.get("/customers", async (req,res)=>{
    const result= await connection.query('SELECT * FROM customers')
    console.log(result.rows)
    res.send(result.rows)
})


//ADICIONAR CLIENTES
app.post("/customers", async (req,res)=>{
    const newCustomer=req.body;
    console.log(req.body)
    try{
        const result= await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1,$2,$3,$4)',[newCustomer.name,newCustomer.phone,newCustomer.cpf,newCustomer.birthday])
        console.log(result)
        res.send(result)
    }catch(e){
        console.log(e)
    }
})


app.listen(4000, ()=>{
    console.log("Server running on port 4000") 
})