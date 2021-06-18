import cors from "cors"
import express from "express"
import pg from "pg"
import joi from "joi"
import dayjs from "dayjs"

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
    try{
        if(req.query.cpf){
            const result= await connection.query('SELECT * FROM customers WHERE cpf ILIKE $1',[req.query.cpf+'%'])
            res.send(result.rows)
        }else{
            const result= await connection.query('SELECT * FROM customers')
            res.send(result.rows)
        }
    }catch(e){
        console.log(e)
    }
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

const customersSchema = joi.object({
    name: joi.string().min(1).required().trim(),
    phone: joi.string().required().trim().pattern(/^[0-9]{10,11}$/),
    cpf: joi.string().required().trim().pattern(/^[0-9]{11}$/),
    birthday: joi.string().required().trim(),//.pattern(/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/),
})


//LISTAR ALUGUEIS
app.get("/rentals", async (req,res)=>{
    // const rentals= await connection.query(`SELECT rentals.*, customers.* AS "rentals.customers", games.* AS "rentals.games"
    //     FROM rentals FULL JOIN customers ON rentals."customerId" = customers.id 
    //     FULL JOIN games ON games.id = rentals."gameId"`)
    //     console.log(rentals)
    //     res.send(rentals.rows)
    
    try{
        const rentals= await connection.query('SELECT * FROM rentals')
        const games= await connection.query('SELECT * FROM games')
        const customers= await connection.query('SELECT * FROM customers')
        const categories= await connection.query('SELECT * FROM categories')
        rentals.rows.forEach(rental=>{
            const game= games.rows.find(g=>g.id===rental.gameId)
            const customer= customers.rows.find(c=>c.id===rental.customerId)
            const category= categories.rows.find(c=>c.id===game.categoryId)
            rental.customer={}
            rental.customer.id= customer.id
            rental.customer.name= customer.name
            rental.game= {}
            rental.game.id= game.id
            rental.game.name= game.name
            rental.game.categoryId= game.categoryId
            rental.game.categoryName= category.name
        })
        if(req.query.customerId && req.query.gameId){
            console.log("primeiro")
            const result = rentals.rows.filter(rental=> rental.customerId===parseInt(req.query.customerId) && rental.gameId===parseInt(req.query.gameId))
            console.log(result)
            res.send(result)
            return
        }
        if(req.query.customerId){
            console.log("segundo")
            const result = rentals.rows.filter(rental=>rental.customerId===parseInt(req.query.customerId))
            console.log(result)
            res.send(result)
            return
        }
        if(req.query.gameId){
            console.log("terceiro")
            console.log(req.query.gameId)
            console.log(parseInt(req.query.gameId))
            const result= rentals.rows.filter(rental=>rental.gameId===parseInt(req.query.gameId))
            console.log(result)
            res.send(result)
            return
        }
        console.log(rentals.rows)
        res.send(rentals.rows)
    }catch(e){
        console.log(e)
    }
})

//ADICIONAR ALUGUEL
app.post("/rentals", async (req,res)=>{
    console.log(dayjs(Date.now()).format("YYYY-MM-DD"))
    const validatedRental = rentalSchema.validate(req.body)
    if(validatedRental.error){
        res.sendStatus(400)
        return
    }
    const newRental=validatedRental.value;
    try{
        const customerExists= await connection.query('SELECT * FROM customers WHERE id = $1',[newRental.customerId])
        if(!customerExists.rows.length){
            res.sendStatus(400)
            return
        }
        const gameExists= await connection.query('SELECT * FROM games WHERE id = $1',[newRental.gameId])
        if(!gameExists.rows.length){
            res.sendStatus(400)
            return
        }
        const gameAvaliable= await connection.query('SELECT * FROM rentals WHERE "gameId" = $1',[newRental.gameId])
        if(gameAvaliable.rows.length===gameExists.rows[0].stockTotal){
            res.sendStatus(400)
            return
        }
        const result= await connection.query(`
            INSERT INTO rentals 
            ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
            VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,[newRental.customerId,newRental.gameId,dayjs(Date.now()).format("YYYY-MM-DD"),newRental.daysRented, null,newRental.daysRented*gameExists.rows[0].pricePerDay,null ])
        res.send(result)
    }catch(e){
        console.log(e)
    }
})

const rentalSchema = joi.object({
    customerId: joi.number().integer().min(1).required(),
    gameId: joi.number().integer().min(1).required(),
    daysRented: joi.number().integer().min(1).required()
})


app.listen(4000, ()=>{
    console.log("Server running on port 4000") 
})