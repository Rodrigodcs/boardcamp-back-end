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
    try{
        const result= await connection.query('SELECT * FROM categories')
        res.send(result.rows)
    }catch(e){
        console.log(e)
    }
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
    console.log(newCategory)
    try{
        const categoryExists= await connection.query('SELECT * FROM categories WHERE name LIKE $1',[newCategory.name])
        if(categoryExists.rows.length>0){
            res.sendStatus(409)
            return
        }
        await connection.query('INSERT INTO categories (name) VALUES ($1)',[newCategory.name])
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
    try{
        if(req.query.name){
            const result= await connection.query('SELECT * FROM games WHERE name ILIKE $1',[req.query.name+'%'])
            res.send(result.rows)
        } else{
            const result= await connection.query('SELECT * FROM games')
            res.send(result.rows)
        }
    } catch(e){
        console.log(e)
    }
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

//LISTAR CLIENTES TODOS
app.get("/customers", async (req,res)=>{
    const result= await connection.query('SELECT * FROM customers')
    console.log(result.rows)
    res.send(result.rows)
})

//LISTAR CLIENTES UNICO
app.get("/customers/:id", async (req,res)=>{
    const customerId = parseInt(req.params.id)
    const result= await connection.query('SELECT * FROM customers WHERE id = $1',[customerId])
    console.log(result.rows)
    res.send(result.rows)
})

//ADICIONAR CLIENTES
app.post("/customers", async (req,res)=>{
    const validatedCustomer = customersSchema.validate(req.body)
    if(validatedCustomer.error){
        res.sendStatus(400)
        return
    }
    const newCustomer=validatedCustomer.value;
    try{
        const customerExists= await connection.query('SELECT * FROM customers WHERE cpf = $1',[newCustomer.cpf])
        if (customerExists.rows.length){
            res.sendStatus(409)
            return
        }
        const result= await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1,$2,$3,$4)',[newCustomer.name,newCustomer.phone,newCustomer.cpf,newCustomer.birthday])
        res.send(result)
    }catch(e){
        console.log(e)
    }
})

//ATUALIZAR CLIENTE
app.put("/customers/:id", async (req,res)=>{
    const customerId = parseInt(req.params.id)
    console.log(customerId)
    const validatedCustomer = customersSchema.validate(req.body)
    if(validatedCustomer.error){
        res.sendStatus(400)
        return
    }
    const newCustomer=validatedCustomer.value;
    try{
        const customerExists= await connection.query('SELECT * FROM customers WHERE cpf = $1 AND id != $2',[newCustomer.cpf,customerId])
        if (customerExists.rows.length){
            res.sendStatus(409)
            return
        }
        const result= await connection.query('UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5',[newCustomer.name,newCustomer.phone,newCustomer.cpf,newCustomer.birthday,customerId])
        res.send(result)
    }catch(e){
        console.log(e)
    }
})

const customerIdSchema = joi.object({
    id: joi.number().integer().min(1).required()
})

const customersSchema = joi.object({
    name: joi.string().min(1).required().trim(),
    phone: joi.string().required().trim().pattern(/^[0-9]{10,11}$/),
    cpf: joi.string().required().trim().pattern(/^[0-9]{11}$/),
    birthday: joi.string().required().trim(),//.pattern(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/),
})

app.listen(4000, ()=>{
    console.log("Server running on port 4000") 
})