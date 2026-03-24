import asyncio

async def fetch_data():
    print("Start fetching...")
    await asyncio.sleep(2)
    print("Done fetching!")
    return {"data": 1}

async def main():

    results = await asyncio.gather(fetch_data(), fetch_data())

asyncio.run(main())

async def web():
    print("Fetching URL #1...")
    await asyncio.sleep(2)
    print("Done")
    print("Fetching URL #2...")
    await asyncio.sleep(2)
    print("Done")
    print("Fetching URL #3...")
    await asyncio.sleep(2)
    print("Done")
    print("Fetching URL #4...")
    await asyncio.sleep(2)
    print("Done")
    print("Fetching URL #5...")
    await asyncio.sleep(2)
    print("Done")

async def main():
    results = await asyncio.gather(fetch_data(), fetch_data())

asyncio.run(main())


func producer(ch chan int){
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}

func main(){
    ch := make(chan int)
    go producer(ch)

    for val := range ch {
        fmt.Println("Received:", val)
    }
}


def task_one():
    print("Task 1: Part A")
    yield
    print("Task 1: Part B")

def task_two():
    print("Task 2: Part A")
    yield
    print("Task 2: Part B")

#simple scheduler

queue = [task_one(), task_two()]
while queue:
    task = queue.pop(0)
    try:
        next(task)
        queue.append(task)
    except StopIteration:
        pass

